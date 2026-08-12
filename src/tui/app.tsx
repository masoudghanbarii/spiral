import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Box, Text, useApp, useInput, useStdin } from "ink";
import { parseSlashCommand, getHelpText, isValidMode } from "./commands.js";
import type { AgentMode, ChatMessage } from "../types.js";
import type {
  SessionData,
  SessionMode,
  SessionAgent,
  LogEntry,
  SessionView,
  ModeOption,
  SessionOption,
  RoleRow,
  SlashCommand,
} from "./components/types.js";
import {
  MODE_META,
  MODE_ORDER,
  AGENT_META,
  STATUS_META,
  ANIMATED_STATUSES,
  GROUP_META,
  GROUP_LETTERS,
  MODEL_LIST,
  ROLE_META,
  ROLE_ORDER,
  SLASH_COMMANDS,
  BRAILLE,
  LOADING_WORDS,
  fmtTok,
} from "./components/types.js";
import { LLMClient } from "../llm.js";
import { Config } from "../config.js";
import { ToolRegistry } from "../tools/registry.js";
import { ManagerRegistry } from "../managers/index.js";
import { TokenCounter } from "../context.js";
import { getSystemPromptSuffix } from "../modes.js";

// Components
import { Onboarding } from "./components/Onboarding.js";
import { Sidebar } from "./components/Sidebar.js";
import { ChatLog } from "./components/ChatLog.js";
import { InputBar } from "./components/InputBar.js";
import { StatusBar } from "./components/StatusBar.js";
import { ModeOverlay, SessionOverlay, AgentPlanOverlay } from "./components/Overlays.js";

type View = "onboarding" | "main";
type OverlayType = "mode" | "session" | "agentplan" | null;

// Extended session with LLM integration state
interface RuntimeSession extends SessionData {
  messages: ChatMessage[];
  tokenCount: number;
  runStartedAt?: number;
}

interface TuiProps {
  config: Config;
  sessionId?: string;
  initialMessage?: string;
  initialView?: View;
}

function createSession(
  id: string,
  name: string,
  model: string,
  provider: string,
  mode: SessionMode,
  agent: SessionAgent,
  tokensMax: number = 1_000_000,
): RuntimeSession {
  return {
    id,
    name,
    shortName: name.length > 20 ? name.slice(0, 17) + "…" : name,
    model,
    provider,
    tokensUsed: 0,
    tokensMax,
    plugins: [],
    mode,
    agent,
    status: "idle",
    groupId: null,
    pendingTool: undefined,
    lastError: undefined,
    roleModels: { plan: model, build: model, judge: model },
    log: [],
    messages: [],
    tokenCount: 0,
    runStartedAt: undefined,
  };
}

export function TuiApp({
  config,
  sessionId,
  initialMessage,
  initialView,
}: TuiProps): React.ReactElement {
  const { exit } = useApp();
  const { stdin, setRawMode } = useStdin();

  // ── View state ──
  const [view, setView] = useState<View>(initialView ?? "onboarding");

  // ── Sessions ──
  const initialSession = useMemo(() => {
    const id = sessionId ?? "s1";
    const name = sessionId ?? "default";
    return createSession(
      id,
      name,
      config.model,
      config.llmProvider ?? "ollama",
      (config.agentMode ?? "normal") as SessionMode,
      "agent",
    );
  }, [sessionId, config.model, config.llmProvider, config.agentMode]);

  const [sessions, setSessions] = useState<RuntimeSession[]>([initialSession]);
  const [activeSessionId, setActiveSessionId] = useState(initialSession.id);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Overlays ──
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [overlayIndex, setOverlayIndex] = useState(0);

  // ── Input ──
  const [input, setInput] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [pendingReRun, setPendingReRun] = useState<string | null>(null);

  // ── Animation ──
  const [frame, setFrame] = useState(0);
  const [ctrlCCount, setCtrlCCount] = useState(0);

  // ── LLM integration ──
  const [verbose, setVerbose] = useState(false);

  const managers = useMemo(() => new ManagerRegistry(config), [config]);
  const llm = useMemo(() => new LLMClient(config), [config]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0]!;

  const tools = useMemo(
    () =>
      new ToolRegistry(
        config,
        managers.project,
        managers.permissions,
        activeSession.mode as AgentMode,
        managers.memory,
      ),
    [config, managers, activeSession.mode],
  );

  const systemPrompt = useMemo(() => {
    const suffix = getSystemPromptSuffix(activeSession.mode as AgentMode);
    return `You are Spiral, the AI co-founder. You help developers build software.\nYou have tools to read/write files, search code, run commands, and manage git.\nThink step by step. Use tools as needed.${suffix}`;
  }, [activeSession.mode]);

  // ── Raw mode for key handling ──
  useEffect(() => {
    setRawMode(true);
    return () => setRawMode(false);
  }, [setRawMode]);

  // ── Raw stdin for Shift+Enter detection ──
  // Ink's useInput doesn't reliably detect Shift+Enter, so we listen
  // for the raw escape sequence on stdin
  useEffect(() => {
    if (!stdin) return;
    const onData = (data: Buffer) => {
      const str = data.toString();
      // Shift+Enter in some terminals: \x1b[13;2~
      if (str === "\x1b[13;2~") {
        setInput((prev) => prev + "\n");
      }
    };
    stdin.on("data", onData);
    return () => {
      stdin.off("data", onData);
    };
  }, [stdin]);

  // ── Frame animation loop (only when animating, slower to prevent flicker) ──
  const anyAnimating = sessions.some((s) => ANIMATED_STATUSES.has(s.status));
  useEffect(() => {
    if (!anyAnimating) return;
    // 250ms = 4fps — smooth enough for braille spinner, no flicker
    const timer = setInterval(() => setFrame((f) => f + 1), 250);
    return () => clearInterval(timer);
  }, [anyAnimating]);

  // ── Ctrl+C reset timer ──
  useEffect(() => {
    if (ctrlCCount > 0) {
      const timer = setTimeout(() => setCtrlCCount(0), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [ctrlCCount]);

  // ── Initial message ──
  useEffect(() => {
    if (initialMessage && view === "main") {
      void sendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Session helpers ──
  const updateSession = useCallback((id: string, patch: Partial<RuntimeSession>) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  // Reset scroll when switching sessions or when new entries arrive
  useEffect(() => {
    setScrollOffset(0);
  }, [activeSessionId]);

  const addLogEntry = useCallback((id: string, entry: LogEntry) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, log: [...s.log, entry] } : s)));
  }, []);

  const approve = useCallback(
    (id: string) => {
      const sess = sessions.find((s) => s.id === id);
      if (!sess?.pendingTool) return;
      // Add tool to approved list so it doesn't ask again
      managers.permissions.addApproved(sess.pendingTool);
      updateSession(id, { status: "running", pendingTool: undefined });
      // Re-run the agent turn with existing messages (delegated to effect)
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "running", pendingTool: undefined } : s)),
      );
      // Trigger re-run via pendingReRun state
      setPendingReRun(id);
    },
    [sessions, managers, updateSession],
  );

  const deny = useCallback(
    (id: string) => {
      updateSession(id, { status: "idle", pendingTool: undefined });
      addLogEntry(id, { kind: "system", text: "Tool execution denied by user." });
    },
    [updateSession, addLogEntry],
  );

  const toggleShare = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const active = prev.find((s) => s.id === activeSessionId);
        const target = prev.find((s) => s.id === id);
        if (!active || !target || active.id === target.id) return prev;

        if (target.groupId && target.groupId === active.groupId) {
          // Unlink
          return prev.map((s) => (s.id === id ? { ...s, groupId: null } : s));
        }

        // Link
        let gid = active.groupId;
        if (!gid) {
          const used = new Set(prev.map((s) => s.groupId).filter(Boolean));
          gid = GROUP_LETTERS.find((l) => !used.has(l)) ?? GROUP_LETTERS[0]!;
          const updated = prev.map((s) => (s.id === active.id ? { ...s, groupId: gid } : s));
          return updated.map((s) => (s.id === id ? { ...s, groupId: gid } : s));
        }

        return prev.map((s) => (s.id === id ? { ...s, groupId: gid } : s));
      });
    },
    [activeSessionId],
  );

  const setRoleModel = useCallback(
    (sid: string, role: "plan" | "build" | "judge", model: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid ? { ...s, roleModels: { ...s.roleModels, [role]: model } } : s,
        ),
      );
    },
    [],
  );

  // ── Slash command execution (from slash menu) ──
  const runCommand = useCallback(
    (cmd: string, sid: string) => {
      const sess = sessions.find((s) => s.id === sid);
      if (!sess) return;

      if (cmd === "/agentplan") {
        setOverlay("agentplan");
        setInput("");
        setSlashIndex(0);
      } else if (cmd === "/mode") {
        setOverlay("mode");
        setOverlayIndex(MODE_ORDER.indexOf(sess.mode));
        setInput("");
        setSlashIndex(0);
      } else if (cmd === "/clear") {
        updateSession(sid, { log: [] });
        setInput("");
        setSlashIndex(0);
      } else if (cmd === "/status") {
        const meta = STATUS_META[sess.status];
        addLogEntry(sid, {
          kind: "system",
          text: `Status: ${meta.label} | Mode: ${sess.mode} | Model: ${sess.model} | Session: ${sess.name}`,
        });
        setInput("");
        setSlashIndex(0);
      } else if (cmd === "/help") {
        addLogEntry(sid, {
          kind: "system",
          text: `Commands: ${SLASH_COMMANDS.map((c) => c.cmd).join(", ")}, /exit, /quit, /model, /sessions, /new, /reset, /abort, /stop, /usage, /verbose, /tools, /history`,
        });
        setInput("");
        setSlashIndex(0);
      } else {
        setInput("");
        setSlashIndex(0);
      }
    },
    [sessions, updateSession, addLogEntry],
  );

  // ── Handle parsed slash commands (from text input) ──
  const handleSlashCommand = useCallback(
    (parsed: ReturnType<typeof parseSlashCommand>): boolean => {
      if (!parsed) return false;
      const sid = activeSessionId;

      switch (parsed.command) {
        case "help":
          addLogEntry(sid, { kind: "system", text: getHelpText() });
          return true;
        case "exit":
        case "quit":
          exit();
          return true;
        case "clear":
          updateSession(sid, { log: [], messages: [], tokenCount: 0 });
          addLogEntry(sid, { kind: "system", text: "Conversation cleared." });
          return true;
        case "mode":
          if (parsed.args && isValidMode(parsed.args)) {
            updateSession(sid, { mode: parsed.args as SessionMode });
            addLogEntry(sid, { kind: "system", text: `Agent mode: ${parsed.args}` });
          } else {
            addLogEntry(sid, {
              kind: "system",
              text: `Current mode: ${activeSession.mode}\nAvailable: normal, plan, bypass, safe, interactive`,
            });
          }
          return true;
        case "model":
          if (parsed.args) {
            updateSession(sid, { model: parsed.args });
            config.model = parsed.args;
            addLogEntry(sid, { kind: "system", text: `Model: ${parsed.args}` });
          } else {
            addLogEntry(sid, { kind: "system", text: `Current model: ${activeSession.model}` });
          }
          return true;
        case "sessions":
          void (async () => {
            const sessList = await managers.memory.listSessions();
            if (sessList.length === 0) {
              addLogEntry(sid, { kind: "system", text: "No sessions found." });
            } else {
              const lines = sessList.map(
                (s) =>
                  `  ${s.sessionId.padEnd(28)} ${s.mode.padEnd(10)} ✓${s.completed} ✗${s.failed} /${s.total}`,
              );
              addLogEntry(sid, { kind: "system", text: `Sessions:\n${lines.join("\n")}` });
            }
          })();
          return true;
        case "new": {
          const newId = `s${sessions.length + 1}`;
          const newSession = createSession(
            newId,
            "default",
            activeSession.model,
            activeSession.provider,
            activeSession.mode,
            activeSession.agent,
            activeSession.tokensMax,
          );
          setSessions((prev) => [...prev, newSession]);
          setActiveSessionId(newId);
          addLogEntry(newId, {
            kind: "system",
            text: "New session started. Previous session kept in sidebar.",
          });
          return true;
        }
        case "reset":
          updateSession(sid, { messages: [], log: [], tokenCount: 0 });
          addLogEntry(sid, { kind: "system", text: "Session reset." });
          return true;
        case "abort":
        case "stop":
          updateSession(sid, { status: "idle" });
          addLogEntry(sid, { kind: "system", text: "Run aborted." });
          return true;
        case "status":
          addLogEntry(sid, {
            kind: "system",
            text: `Status: ${STATUS_META[activeSession.status].label}\nMode: ${activeSession.mode}\nModel: ${activeSession.model}\nMessages: ${activeSession.messages.length}\nTokens: ~${activeSession.tokenCount}\nSession: ${activeSession.name}`,
          });
          return true;
        case "usage":
          addLogEntry(sid, {
            kind: "system",
            text: `Token estimate: ~${activeSession.tokenCount}\nMessages: ${activeSession.messages.length}`,
          });
          return true;
        case "verbose": {
          const v = parsed.args === "on" || parsed.args === "full";
          setVerbose(v);
          addLogEntry(sid, { kind: "system", text: `Verbose: ${v ? "on" : "off"}` });
          return true;
        }
        case "tools": {
          const defs = tools.getToolDefinitions();
          addLogEntry(sid, {
            kind: "system",
            text: `Available tools (${defs.length}):\n${defs.map((d) => `  ${d.function.name} — ${d.function.description}`).join("\n")}`,
          });
          return true;
        }
        case "history":
          addLogEntry(sid, {
            kind: "system",
            text: `Conversation: ${activeSession.messages.length} messages, ~${activeSession.tokenCount} tokens, ${activeSession.log.length} display entries`,
          });
          return true;
        case "agentplan":
          setOverlay("agentplan");
          return true;
        case "unknown":
          addLogEntry(sid, {
            kind: "system",
            text: `Unknown command: ${parsed.raw}. Type /help for available commands.`,
          });
          return true;
        default:
          return false;
      }
    },
    [exit, activeSession, activeSessionId, managers, tools, addLogEntry, updateSession, config],
  );

  // ── Agent turn (LLM + tools) ──
  const runAgentTurn = useCallback(
    async (sid: string, userMessages: ChatMessage[]) => {
      const sess = sessions.find((s) => s.id === sid);
      if (!sess) return;

      updateSession(sid, { status: "running", runStartedAt: Date.now() });
      addLogEntry(sid, { kind: "assistant", text: "" });

      try {
        const allMessages: ChatMessage[] = [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ];
        const toolDefs = tools.getToolDefinitions();

        // Timeout wrapper — prevent perpetual loading
        const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
          Promise.race([
            p,
            new Promise<T>((_, reject) =>
              setTimeout(
                () => reject(new Error("Request timed out after " + Math.floor(ms / 1000) + "s")),
                ms,
              ),
            ),
          ]);

        let response;
        if (config.streamEnabled) {
          let accumulated = "";
          response = await withTimeout(
            llm.chatStream(allMessages, toolDefs, (chunk: string) => {
              accumulated += chunk;
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id !== sid) return s;
                  const log = [...s.log];
                  const lastIdx = log.length - 1;
                  if (lastIdx >= 0 && log[lastIdx]!.kind === "assistant") {
                    log[lastIdx] = { ...log[lastIdx]!, text: accumulated };
                  }
                  return { ...s, log };
                }),
              );
            }),
            120_000, // 2 min timeout
          );
        } else {
          response = await withTimeout(llm.chat(allMessages, toolDefs), 120_000);
        }

        const msg = response.message;
        const content = msg.content ?? "";

        if (!config.streamEnabled) {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sid) return s;
              const log = [...s.log];
              const lastIdx = log.length - 1;
              if (lastIdx >= 0 && log[lastIdx]!.kind === "assistant") {
                log[lastIdx] = { ...log[lastIdx]!, text: content };
              }
              return { ...s, log };
            }),
          );
        }

        const toolCalls = msg.tool_calls ?? [];
        for (const tc of toolCalls) {
          const funcName = tc.function.name;
          let funcArgs: Record<string, unknown> = {};
          try {
            funcArgs = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            funcArgs = {};
          }

          addLogEntry(sid, {
            kind: "tool",
            tool: funcName,
            detail: JSON.stringify(funcArgs).slice(0, 100),
          });

          updateSession(sid, { status: "tool_call" });

          const result = await tools.execute(funcName, funcArgs);

          // Check if result is a permission denial
          if (result.startsWith("Approval required") || result.startsWith("Error: Approval")) {
            updateSession(sid, { status: "waiting_approval", pendingTool: funcName });
            // Store the pending tool call for re-execution after approval
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== sid) return s;
                const log = [...s.log];
                const lastIdx = log.length - 1;
                if (lastIdx >= 0 && log[lastIdx]!.kind === "tool") {
                  log[lastIdx] = { ...log[lastIdx]!, detail: "awaiting approval…" };
                }
                return { ...s, log, pendingTool: funcName };
              }),
            );
            // Don't continue — wait for user approval
            return;
          }

          // Update last tool entry with result
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sid) return s;
              const log = [...s.log];
              const lastIdx = log.length - 1;
              if (lastIdx >= 0 && log[lastIdx]!.kind === "tool") {
                log[lastIdx] = {
                  ...log[lastIdx]!,
                  detail: verbose ? result : result.slice(0, 200),
                };
              }
              return { ...s, log };
            }),
          );

          allMessages.push(
            { role: "assistant", content },
            { role: "tool", content: result.slice(0, 2000), tool_call_id: tc.id },
          );
        }

        // Finalize
        updateSession(sid, { status: "idle", runStartedAt: undefined });
        const tokenCount = TokenCounter.estimateMessages(allMessages);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sid
              ? {
                  ...s,
                  messages: [
                    ...s.messages,
                    ...userMessages.slice(-1)!,
                    { role: "assistant", content },
                  ],
                  tokenCount,
                  tokensUsed: tokenCount,
                }
              : s,
          ),
        );
      } catch (e) {
        const errMsg = (e as Error).message;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sid) return s;
            const log = [...s.log];
            const lastIdx = log.length - 1;
            if (lastIdx >= 0 && log[lastIdx]!.kind === "assistant") {
              log[lastIdx] = { ...log[lastIdx]!, text: `Error: ${errMsg}` };
            }
            return { ...s, status: "error", lastError: errMsg, log, runStartedAt: undefined };
          }),
        );
      }
    },
    [systemPrompt, tools, llm, config, verbose, sessions, updateSession, addLogEntry],
  );

  // ── Re-run agent turn after approval ──
  useEffect(() => {
    if (pendingReRun) {
      const sess = sessions.find((s) => s.id === pendingReRun);
      if (sess && sess.messages.length > 0) {
        void runAgentTurn(pendingReRun, sess.messages);
      }
      setPendingReRun(null);
    }
  }, [pendingReRun, sessions, runAgentTurn]);

  // ── Send message ──
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const sid = activeSessionId;

      // Check for slash command
      const slash = parseSlashCommand(trimmed);
      if (slash) {
        handleSlashCommand(slash);
        return;
      }

      // Shell command
      if (trimmed.startsWith("!")) {
        const shellCmd = trimmed.slice(1);
        addLogEntry(sid, { kind: "system", text: `$ ${shellCmd}` });
        try {
          const { execSync } = await import("node:child_process");
          const output = execSync(shellCmd, { encoding: "utf-8", timeout: 10000 }).slice(0, 1000);
          addLogEntry(sid, { kind: "system", text: output });
        } catch (e) {
          addLogEntry(sid, { kind: "system", text: `Error: ${(e as Error).message}` });
        }
        return;
      }

      // User message
      addLogEntry(sid, { kind: "user", text: trimmed });
      setHistory((prev) => [...prev, trimmed]);

      const sess = sessions.find((s) => s.id === sid);
      if (!sess) return;

      // Derive session name from first user message
      if (sess.messages.length === 0 && sess.name === "default") {
        const preview = trimmed.length > 40 ? trimmed.slice(0, 37) + "…" : trimmed;
        const newName = `#1 - ${preview}`;
        updateSession(sid, { name: newName, shortName: newName.length > 20 ? newName.slice(0, 17) + "…" : newName });
      }

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const newMessages = [...sess.messages, userMsg];
      updateSession(sid, { messages: newMessages });
      await runAgentTurn(sid, newMessages);
    },
    [handleSlashCommand, addLogEntry, activeSessionId, sessions, updateSession, runAgentTurn],
  );

  // ── Onboarding launch ──
  const handleOnboardingLaunch = useCallback(
    (prompt: string) => {
      setView("main");
      // Add the prompt as first user message
      const sid = sessions[0]!.id;
      addLogEntry(sid, { kind: "user", text: prompt });
      // Derive session name from first user message
      const preview = prompt.length > 40 ? prompt.slice(0, 37) + "…" : prompt;
      const newName = `#1 - ${preview}`;
      updateSession(sid, { name: newName, shortName: newName.length > 20 ? newName.slice(0, 17) + "…" : newName });
      const userMsg: ChatMessage = { role: "user", content: prompt };
      updateSession(sid, { messages: [userMsg] });
      void runAgentTurn(sid, [userMsg]);
    },
    [sessions, addLogEntry, updateSession, runAgentTurn],
  );

  // ── Overlay list for keyboard navigation ──
  const overlayList = useMemo(() => {
    if (overlay === "mode") return MODE_ORDER;
    if (overlay === "session") return sessions.map((s) => s.id);
    return [];
  }, [overlay, sessions]);

  // ── Input handling ──
  useInput((inputChar: string, key: any) => {
    // ── Onboarding view (Onboarding component handles its own input) ──
    if (view === "onboarding") return;

    // ── Main view ──
    if (view !== "main") return;

    // Overlay navigation
    if (overlay === "mode" || overlay === "session") {
      if (key.upArrow) {
        setOverlayIndex((i) => (i - 1 + overlayList.length) % overlayList.length);
        return;
      }
      if (key.downArrow) {
        setOverlayIndex((i) => (i + 1) % overlayList.length);
        return;
      }
      if (key.return) {
        if (overlay === "mode") {
          const mode = MODE_ORDER[overlayIndex];
          if (mode) updateSession(activeSessionId, { mode });
          setOverlay(null);
        } else if (overlay === "session") {
          const sid = overlayList[overlayIndex] as string;
          if (sid) setActiveSessionId(sid);
          setOverlay(null);
        }
        return;
      }
      if (key.escape) {
        setOverlay(null);
        return;
      }
      if (key.tab && !key.shift) {
        setOverlayIndex((i) => (i + 1) % overlayList.length);
        return;
      }
      if (key.tab && key.shift) {
        setOverlayIndex((i) => (i - 1 + overlayList.length) % overlayList.length);
        return;
      }
      return;
    }

    // AgentPlan overlay — Escape or Enter to close
    if (overlay === "agentplan") {
      if (key.escape || key.return) {
        setOverlay(null);
        return;
      }
      return;
    }

    // ── Tab / Shift+Tab to open overlays ──
    if (key.tab && !key.shift) {
      setOverlay("session");
      setOverlayIndex(sessions.findIndex((s) => s.id === activeSessionId));
      return;
    }
    if (key.tab && key.shift) {
      setOverlay("mode");
      setOverlayIndex(MODE_ORDER.indexOf(activeSession.mode as AgentMode));
      return;
    }

    // ── Escape to close overlays / abort ──
    if (key.escape) {
      setOverlay(null);
      if (ANIMATED_STATUSES.has(activeSession.status)) {
        updateSession(activeSessionId, { status: "idle" });
      }
      return;
    }

    // ── Enter to send or approve ──
    if (key.return && !key.shift) {
      // If waiting for approval, Enter approves
      if (activeSession.status === "waiting_approval") {
        approve(activeSessionId);
        return;
      }
      // If input starts with /, try to run as slash command
      if (input.startsWith("/")) {
        const slashFiltered = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input.toLowerCase()));
        if (slashFiltered.length > 0) {
          runCommand(slashFiltered[slashIndex]!.cmd, activeSessionId);
          return;
        }
      }
      // Send message
      if (input.trim()) {
        void sendMessage(input);
        setInput("");
        setHistoryIdx(-1);
      }
      return;
    }

    // ── Shift+Enter or Ctrl+J for newline ──
    if ((key.return && key.shift) || (key.ctrl && inputChar === "j")) {
      setInput((prev) => prev + "\n");
      return;
    }

    // ── Ctrl+C ──
    if (key.ctrl && inputChar === "c") {
      if (input.length > 0) {
        setInput("");
      } else {
        setCtrlCCount((c) => c + 1);
        if (ctrlCCount >= 1) {
          exit();
        }
      }
      return;
    }

    // ── Ctrl+D to exit ──
    if (key.ctrl && inputChar === "d") {
      exit();
      return;
    }

    // ── Ctrl+L to clear ──
    if (key.ctrl && inputChar === "l") {
      updateSession(activeSessionId, { log: [] });
      return;
    }

    // ── Ctrl+Up/Ctrl+Down to scroll chat log ──
    if (key.ctrl && key.upArrow) {
      setScrollOffset((o) => Math.min(o + 5, activeSession.log.length));
      return;
    }
    if (key.ctrl && key.downArrow) {
      setScrollOffset((o) => Math.max(o - 5, 0));
      return;
    }

    // ── Arrow up/down for slash menu or history ──
    if (key.upArrow) {
      if (input.startsWith("/")) {
        const slashFiltered = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input.toLowerCase()));
        if (slashFiltered.length > 0) {
          setSlashIndex((i) => (i - 1 + slashFiltered.length) % slashFiltered.length);
          return;
        }
      }
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]!);
      }
      return;
    }

    if (key.downArrow) {
      if (input.startsWith("/")) {
        const slashFiltered = SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input.toLowerCase()));
        if (slashFiltered.length > 0) {
          setSlashIndex((i) => (i + 1) % slashFiltered.length);
          return;
        }
      }
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput("");
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]!);
        }
      }
      return;
    }

    // ── Backspace (delete last char) ──
    if ((key.backspace || key.delete) && !key.ctrl) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    // ── Ctrl+Backspace or Ctrl+W (delete last word) ──
    if ((key.ctrl && (key.backspace || key.delete)) || (key.ctrl && inputChar === "w")) {
      setInput((prev) => {
        // Remove trailing whitespace, then remove last word
        const trimmed = prev.replace(/\s+$/, "");
        const lastSpace = Math.max(trimmed.lastIndexOf(" "), trimmed.lastIndexOf("\n"));
        return lastSpace >= 0 ? trimmed.slice(0, lastSpace + 1) : "";
      });
      return;
    }

    // ── Regular character input ──
    if (inputChar && !key.ctrl && !key.meta && !key.return && !key.tab) {
      setInput((prev) => prev + inputChar);
    }
  });

  void stdin;

  // ── Computed values for rendering ──
  const animate = ANIMATED_STATUSES.has(activeSession.status);
  const activeMeta = STATUS_META[activeSession.status];
  const modeMeta = MODE_META[activeSession.mode];
  const agentMeta = AGENT_META[activeSession.agent];
  // Rotate loading word every 8 frames (2s at 250ms) instead of every 24 frames
  const loadingWord = animate
    ? LOADING_WORDS[Math.floor(frame / 8) % LOADING_WORDS.length]!
    : activeMeta.label;
  const spinnerIcon = animate ? BRAILLE[frame % BRAILLE.length]! : activeMeta.icon;
  // Compute real elapsed time from runStartedAt
  const elapsedSec = activeSession.runStartedAt
    ? Math.floor((Date.now() - activeSession.runStartedAt) / 1000)
    : 0;
  const elapsedLabel = activeSession.runStartedAt
    ? elapsedSec < 60
      ? `${elapsedSec}s`
      : `${Math.floor(elapsedSec / 60)}m${elapsedSec % 60}s`
    : "0s";
  const pct = Math.round((activeSession.tokensUsed / activeSession.tokensMax) * 100);
  const tokensLabel = `${fmtTok(activeSession.tokensUsed)}/${fmtTok(activeSession.tokensMax)} (${pct}%)`;
  const roleModelsLabel = `plan ${activeSession.roleModels.plan} · build ${activeSession.roleModels.build} · judge ${activeSession.roleModels.judge}`;

  // Slash command filtering
  const slashFiltered = input.startsWith("/")
    ? SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input.toLowerCase()))
    : [];
  const slashMenuOpen = slashFiltered.length > 0;
  const slashCommandsForMenu: SlashCommand[] = slashFiltered.map((c, i) => ({
    cmd: c.cmd,
    desc: c.desc,
    rowBg: i === slashIndex ? "rgba(79,140,255,0.16)" : "transparent",
    onClick: () => runCommand(c.cmd, activeSessionId),
  }));

  // Session sidebar views
  const query = searchQuery.trim().toLowerCase();
  const groupOrder: string[] = [];
  sessions.forEach((s) => {
    if (s.groupId && !groupOrder.includes(s.groupId)) groupOrder.push(s.groupId);
  });
  const sortedSessions = [...sessions].sort((a, b) => {
    const ai = a.groupId ? groupOrder.indexOf(a.groupId) : 999;
    const bi = b.groupId ? groupOrder.indexOf(b.groupId) : 999;
    if (ai !== bi) return ai - bi;
    return sessions.indexOf(a) - sessions.indexOf(b);
  });

  const sessionsView: SessionView[] = sortedSessions
    .filter((s) => !query || s.name.toLowerCase().includes(query))
    .map((s) => {
      const meta = STATUS_META[s.status];
      const sAnimate = ANIMATED_STATUSES.has(s.status);
      const spin = BRAILLE[(frame + s.id.charCodeAt(1) * 3) % BRAILLE.length];
      const group = s.groupId ? GROUP_META[s.groupId] : null;
      const isActive = s.id === activeSession.id;
      const sModeMeta = MODE_META[s.mode];
      const linkActive = !!(activeSession.groupId && s.groupId === activeSession.groupId);

      return {
        id: s.id,
        name: s.shortName,
        borderColor: group ? group.color : "#2a3140",
        groupDot: group ? group.color : null,
        statusIcon: sAnimate ? spin : meta.icon,
        statusColor: meta.color,
        statusLabel: meta.label,
        modeColor: sModeMeta.color,
        agentLabel: s.agent,
        nameColor: isActive ? "#e6e9ef" : "#a8afbc",
        rowBg: isActive
          ? "rgba(79,140,255,0.10)"
          : group
            ? `rgba(${group.color},0.07)`
            : "transparent",
        isActive,
        canLink: !isActive,
        linkActive,
        linkColor: linkActive ? (group?.color ?? "#4a5164") : "#4a5164",
        linkSpacer: group ? "4px" : "auto",
        onClick: () => setActiveSessionId(s.id),
        onToggleLink: () => toggleShare(s.id),
      };
    });

  // Mode overlay options
  const modeOptions: ModeOption[] = MODE_ORDER.map((m) => ({
    key: m,
    ...MODE_META[m],
    rowBg: activeSession.mode === m ? "rgba(255,255,255,0.06)" : "transparent",
    onClick: () => {
      updateSession(activeSessionId, { mode: m });
      setOverlay(null);
    },
  }));

  // Session overlay options
  const sessionOptions: SessionOption[] = sessions.map((s) => {
    const meta = STATUS_META[s.status];
    const group = s.groupId ? GROUP_META[s.groupId] : null;
    return {
      key: s.id,
      color: s.id === activeSessionId ? "#4f8cff" : "#c7cdd8",
      label: s.shortName,
      desc: meta.label + (group ? ` · ${group.label}` : ""),
      rowBg: s.id === activeSessionId ? "rgba(255,255,255,0.06)" : "transparent",
      onClick: () => {
        setActiveSessionId(s.id);
        setOverlay(null);
      },
    };
  });

  // AgentPlan role rows
  const roleRows: RoleRow[] = ROLE_ORDER.map((role) => ({
    role,
    label: ROLE_META[role]!.label,
    desc: ROLE_META[role]!.desc,
    models: MODEL_LIST.map((m) => {
      const sel = activeSession.roleModels[role as "plan" | "build" | "judge"] === m;
      return {
        name: m,
        borderColor: sel ? "#4f8cff" : "#2a3140",
        bg: sel ? "rgba(79,140,255,0.14)" : "transparent",
        onClick: () => setRoleModel(activeSessionId, role as "plan" | "build" | "judge", m),
      };
    }),
  }));

  // Group counts
  const groupCount = new Set(sessions.map((s) => s.groupId).filter(Boolean)).size;

  // ── Onboarding view ──
  if (view === "onboarding") {
    return (
      <Onboarding
        onLaunch={handleOnboardingLaunch}
        model={activeSession.model}
        mode={modeMeta.label}
        modeColor={modeMeta.color}
        agent={agentMeta.label}
        plugins={activeSession.plugins}
      />
    );
  }

  // ── Main view ──
  return (
    <Box flexDirection="column" height="100%" position="relative">
      {/* Top bar */}
      <Box
        justifyContent="space-between"
        paddingX={1}
        borderStyle="single"
        borderColor="gray"
        flexShrink={0}
      >
        <Box>
          <Text bold color="blue">
            spiral
          </Text>
          <Text color="gray"> v1.0</Text>
        </Box>
        <Text color="gray">
          {sessions.length} sessions · {groupCount} groups sharing context
        </Text>
      </Box>

      <Box flexDirection="row" flexGrow={1}>
        {/* Session sidebar */}
        <Sidebar
          sessions={sessionsView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Main content area */}
        <Box flexDirection="column" flexGrow={1}>
          {/* Session header */}
          <Box paddingX={1} borderStyle="single" borderColor="gray" flexShrink={0}>
            <Box gap={1}>
              <Text bold>{activeSession.shortName}</Text>
              <Text color="gray">[</Text>
              <Text color={activeMeta.color as any}>{activeMeta.label} ⟳</Text>
              <Text color="gray">]</Text>
            </Box>
            {activeSession.groupId && (
              <Box marginTop={1} gap={1}>
                <Text color={(GROUP_META[activeSession.groupId]?.color ?? "gray") as any}>
                  ⇄ sharing context — {GROUP_META[activeSession.groupId]?.label} with:
                </Text>
                {sessions
                  .filter((s) => s.groupId === activeSession.groupId && s.id !== activeSession.id)
                  .map((s) => (
                    <Text key={s.id} color="white">
                      {s.shortName}
                    </Text>
                  ))}
              </Box>
            )}
          </Box>

          {/* Chat log with banners */}
          <ChatLog
            entries={activeSession.log}
            scrollOffset={scrollOffset}
            isWaitingApproval={activeSession.status === "waiting_approval"}
            pendingTool={activeSession.pendingTool ?? ""}
            onApprove={() => approve(activeSessionId)}
            onDeny={() => deny(activeSessionId)}
            isError={activeSession.status === "error"}
            lastError={activeSession.lastError ?? ""}
            isCompacting={activeSession.status === "compacting"}
            isRunning={animate && activeSession.status === "running"}
            statusIcon={spinnerIcon}
            loadingWord={loadingWord}
            elapsed={elapsedLabel}
          />

          {/* Input bar */}
          <InputBar
            input={input}
            onInputChange={setInput}
            onSubmit={() => {
              if (input.trim()) {
                void sendMessage(input);
                setInput("");
                setHistoryIdx(-1);
              }
            }}
            disabled={animate}
            placeholder={animate ? "agent is busy…" : "send a message"}
            borderColor={animate ? "yellow" : "blue"}
            model={activeSession.model}
            modeLabel={modeMeta.label}
            modeColor={modeMeta.color}
            sessionShort={activeSession.shortName}
            onOpenModeOverlay={() => {
              setOverlay("mode");
              setOverlayIndex(MODE_ORDER.indexOf(activeSession.mode as AgentMode));
            }}
            onOpenSessionOverlay={() => {
              setOverlay("session");
              setOverlayIndex(sessions.findIndex((s) => s.id === activeSessionId));
            }}
            slashCommands={slashCommandsForMenu}
            slashMenuOpen={slashMenuOpen}
            slashIndex={slashIndex}
            onSlashSelect={(idx) => {
              if (slashFiltered[idx]) {
                runCommand(slashFiltered[idx]!.cmd, activeSessionId);
              }
            }}
          />

          {/* Status bar */}
          <StatusBar
            statusIcon={spinnerIcon}
            statusColor={activeMeta.color}
            statusLabel={activeMeta.label}
            elapsed={elapsedLabel}
            modeLabel={modeMeta.label}
            agentLabel={agentMeta.label}
            sessionName={activeSession.name}
            provider={activeSession.provider}
            tokensLabel={tokensLabel}
            pluginsLabel={
              activeSession.plugins.length > 0 ? activeSession.plugins.join(", ") : null
            }
            roleModelsLabel={roleModelsLabel}
            onOpenAgentPlan={() => setOverlay("agentplan")}
          />
        </Box>
      </Box>

      {/* Overlays */}
      <ModeOverlay
        open={overlay === "mode"}
        options={modeOptions}
        overlayIndex={overlayIndex}
        onClose={() => setOverlay(null)}
      />

      <SessionOverlay
        open={overlay === "session"}
        options={sessionOptions}
        overlayIndex={overlayIndex}
        onClose={() => setOverlay(null)}
      />

      <AgentPlanOverlay
        open={overlay === "agentplan"}
        roleRows={roleRows}
        onClose={() => setOverlay(null)}
      />
    </Box>
  );
}
