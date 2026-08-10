import React, { useState, useCallback, useEffect } from "react";
import { Box, Text, useApp, useInput, useStdin } from "ink";
import { parseSlashCommand, getHelpText, isValidMode } from "./commands.js";
import type { AgentMode, ChatMessage } from "../types.js";
import { LLMClient } from "../llm.js";
import { Config } from "../config.js";
import { ToolRegistry } from "../tools/registry.js";
import { ManagerRegistry } from "../managers/index.js";
import { TokenCounter } from "../context.js";
import { getSystemPromptSuffix } from "../modes.js";

interface ChatEntry {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  isTool?: boolean;
  streaming?: boolean;
}

interface TuiProps {
  config: Config;
  sessionId?: string;
  initialMessage?: string;
}

export function TuiApp({ config, sessionId, initialMessage }: TuiProps): React.ReactElement {
  const { exit } = useApp();
  const { stdin, setRawMode } = useStdin();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("idle");
  const [agentMode, setAgentMode] = useState<AgentMode>(config.agentMode as AgentMode);
  const [model, setModel] = useState(config.model);
  const [verbose, setVerbose] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ctrlCCount, setCtrlCCount] = useState(0);

  const managers = React.useMemo(() => new ManagerRegistry(config), [config]);
  const llm = React.useMemo(() => new LLMClient(config), [config]);
  const tools = React.useMemo(
    () => new ToolRegistry(config, managers.project, managers.permissions, agentMode),
    [config, managers, agentMode],
  );
  const systemPrompt = React.useMemo(() => {
    const suffix = getSystemPromptSuffix(agentMode);
    return `You are Spiral, the AI co-founder. You help developers build software.\nYou have tools to read/write files, search code, run commands, and manage git.\nThink step by step. Use tools as needed.${suffix}`;
  }, [agentMode]);

  useEffect(() => {
    setRawMode(true);
    return () => setRawMode(false);
  }, [setRawMode]);

  useEffect(() => {
    if (entries.length === 0) {
      setEntries([
        {
          role: "system",
          content: `Spiral TUI — mode: ${agentMode} | model: ${model} | session: ${sessionId ?? "default"}\nType /help for commands. Enter to send.`,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (initialMessage) {
      void sendMessage(initialMessage);
    }
  }, []);

  useEffect(() => {
    if (ctrlCCount > 0) {
      const timer = setTimeout(() => setCtrlCCount(0), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [ctrlCCount]);

  const addEntry = useCallback((entry: ChatEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  const updateLastEntry = useCallback((content: string) => {
    setEntries((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1]!;
      return [...prev.slice(0, -1), { ...last, content }];
    });
  }, []);

  const handleSlashCommand = useCallback(
    (cmd: ReturnType<typeof parseSlashCommand>): boolean => {
      if (!cmd) return false;
      switch (cmd.command) {
        case "help":
          addEntry({ role: "system", content: getHelpText() });
          return true;
        case "exit":
        case "quit":
          exit();
          return true;
        case "clear":
          setEntries([]);
          setMessages([]);
          setTokenCount(0);
          addEntry({ role: "system", content: "Conversation cleared." });
          return true;
        case "mode":
          if (cmd.args && isValidMode(cmd.args)) {
            setAgentMode(cmd.args as AgentMode);
            addEntry({ role: "system", content: `Agent mode: ${cmd.args}` });
          } else {
            addEntry({
              role: "system",
              content: `Current mode: ${agentMode}\nAvailable: normal, plan, bypass, safe, interactive`,
            });
          }
          return true;
        case "model":
          if (cmd.args) {
            setModel(cmd.args);
            config.model = cmd.args;
            addEntry({ role: "system", content: `Model: ${cmd.args}` });
          } else {
            addEntry({ role: "system", content: `Current model: ${model}` });
          }
          return true;
        case "sessions":
          void (async () => {
            const sessions = await managers.memory.listSessions();
            if (sessions.length === 0) {
              addEntry({ role: "system", content: "No sessions found." });
            } else {
              const lines = sessions.map(
                (s) =>
                  `  ${s.sessionId.padEnd(28)} ${s.mode.padEnd(10)} ✓${s.completed} ✗${s.failed} /${s.total}`,
              );
              addEntry({ role: "system", content: `Sessions:\n${lines.join("\n")}` });
            }
          })();
          return true;
        case "new":
          addEntry({
            role: "system",
            content: "Starting fresh session. Previous conversation kept in history.",
          });
          setMessages([]);
          return true;
        case "reset":
          setMessages([]);
          setEntries([]);
          setTokenCount(0);
          addEntry({ role: "system", content: "Session reset." });
          return true;
        case "abort":
        case "stop":
          setStatus("idle");
          setRunning(false);
          addEntry({ role: "system", content: "Run aborted." });
          return true;
        case "status":
          addEntry({
            role: "system",
            content: `Status: ${status}\nMode: ${agentMode}\nModel: ${model}\nMessages: ${messages.length}\nTokens: ~${tokenCount}\nSession: ${sessionId ?? "default"}`,
          });
          return true;
        case "usage":
          addEntry({
            role: "system",
            content: `Token estimate: ~${tokenCount}\nMessages: ${messages.length}`,
          });
          return true;
        case "verbose":
          const v = cmd.args === "on" || cmd.args === "full";
          setVerbose(v);
          addEntry({ role: "system", content: `Verbose: ${v ? "on" : "off"}` });
          return true;
        case "tools":
          const defs = tools.getToolDefinitions();
          addEntry({
            role: "system",
            content: `Available tools (${defs.length}):\n${defs.map((d) => `  ${d.function.name} — ${d.function.description}`).join("\n")}`,
          });
          return true;
        case "history":
          addEntry({
            role: "system",
            content: `Conversation: ${messages.length} messages, ~${tokenCount} tokens, ${entries.length} display entries`,
          });
          return true;
        case "unknown":
          addEntry({
            role: "system",
            content: `Unknown command: ${cmd.raw}. Type /help for available commands.`,
          });
          return true;
        default:
          return false;
      }
    },
    [
      exit,
      agentMode,
      model,
      messages,
      tokenCount,
      entries.length,
      status,
      sessionId,
      managers,
      tools,
      addEntry,
    ],
  );

  const runAgentTurn = useCallback(
    async (userMessages: ChatMessage[]) => {
      setRunning(true);
      setStatus("running");
      addEntry({ role: "assistant", content: "", streaming: true });

      try {
        const allMessages: ChatMessage[] = [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ];
        const toolDefs = tools.getToolDefinitions();
        let response;
        if (config.streamEnabled) {
          let accumulated = "";
          response = await llm.chatStream(allMessages, toolDefs, (chunk: string) => {
            accumulated += chunk;
            updateLastEntry(accumulated);
          });
        } else {
          response = await llm.chat(allMessages, toolDefs);
        }

        const msg = response.message;
        const content = msg.content ?? "";
        if (!config.streamEnabled) {
          updateLastEntry(content);
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

          addEntry({
            role: "tool",
            content: "",
            toolName: funcName,
            toolArgs: funcArgs,
            isTool: true,
          });

          const result = await tools.execute(funcName, funcArgs);
          updateLastEntry(verbose ? result : result.slice(0, 200));

          allMessages.push(
            { role: "assistant", content },
            { role: "tool", content: result.slice(0, 2000), tool_call_id: tc.id },
          );
        }

        if (content.includes("FINAL_RESULT") || toolCalls.length === 0) {
          setStatus("idle");
          setRunning(false);
          setMessages((prev) => [
            ...prev,
            ...userMessages.slice(-1)!,
            { role: "assistant", content },
          ]);
          setTokenCount(TokenCounter.estimateMessages(allMessages));
        }
      } catch (e) {
        updateLastEntry(`Error: ${(e as Error).message}`);
        setStatus("error");
        setRunning(false);
      }
    },
    [systemPrompt, tools, llm, config, verbose, addEntry, updateLastEntry],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const slash = parseSlashCommand(trimmed);
      if (slash) {
        handleSlashCommand(slash);
        return;
      }

      if (trimmed.startsWith("!")) {
        const shellCmd = trimmed.slice(1);
        addEntry({ role: "system", content: `$ ${shellCmd}` });
        try {
          const { execSync } = await import("node:child_process");
          const output = execSync(shellCmd, { encoding: "utf-8", timeout: 10000 }).slice(0, 1000);
          addEntry({ role: "system", content: output });
        } catch (e) {
          addEntry({ role: "system", content: `Error: ${(e as Error).message}` });
        }
        return;
      }

      addEntry({ role: "user", content: trimmed });
      setHistory((prev) => [...prev, trimmed]);

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      await runAgentTurn(newMessages);
    },
    [handleSlashCommand, addEntry, messages, runAgentTurn],
  );

  useInput((inputChar: string, key: any) => {
    if (key.return && !key.shift) {
      if (input.trim()) {
        void sendMessage(input);
        setInput("");
        setHistoryIdx(-1);
      }
      return;
    }
    if ((key.return && key.shift) || (key.ctrl && inputChar === "j")) {
      setInput((prev) => prev + "\n");
      return;
    }
    if (key.escape) {
      setStatus("idle");
      setRunning(false);
      return;
    }
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
    if (key.ctrl && inputChar === "d") {
      exit();
      return;
    }
    if (key.ctrl && inputChar === "l") {
      setEntries([]);
      return;
    }
    if (key.upArrow) {
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]!);
      }
      return;
    }
    if (key.downArrow) {
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
    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if (inputChar && !key.ctrl && !key.meta) {
      setInput((prev) => prev + inputChar);
    }
  });

  void stdin;

  return (
    <Box flexDirection="column" height="100%">
      <Header mode={agentMode} model={model} sessionId={sessionId ?? "default"} />
      <ChatLog entries={entries} />
      <StatusBar
        status={status}
        running={running}
        tokenCount={tokenCount}
        messageCount={messages.length}
      />
      <InputBox input={input} running={running} ctrlCCount={ctrlCCount} />
    </Box>
  );
}

function Header({
  mode,
  model,
  sessionId,
}: {
  mode: AgentMode;
  model: string;
  sessionId: string;
}): React.ReactElement {
  const modeColor =
    mode === "plan"
      ? "yellow"
      : mode === "bypass"
        ? "red"
        : mode === "safe"
          ? "cyan"
          : mode === "interactive"
            ? "magenta"
            : "green";
  return (
    <Box borderStyle="round" borderColor="blue" paddingX={1}>
      <Text bold color="blue">
        {" "}
        spiral{" "}
      </Text>
      <Text> | mode: </Text>
      <Text bold color={modeColor as any}>
        {mode}
      </Text>
      <Text> | model: </Text>
      <Text bold>{model}</Text>
      <Text> | session: </Text>
      <Text bold>{sessionId}</Text>
    </Box>
  );
}

function ChatLog({ entries }: { entries: ChatEntry[] }): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1}>
      {entries.map((entry, i) => (
        <EntryView key={i} entry={entry} />
      ))}
    </Box>
  );
}

function EntryView({ entry }: { entry: ChatEntry }): React.ReactElement {
  if (entry.role === "user") {
    return (
      <Box>
        <Text bold color="cyan">
          {"\n> "}
        </Text>
        <Text>{entry.content}</Text>
      </Box>
    );
  }
  if (entry.role === "assistant") {
    return (
      <Box>
        <Text bold color="green">
          {"\n✦ "}
        </Text>
        <Text color={entry.streaming ? "gray" : undefined}>
          {entry.content || (entry.streaming ? "..." : "")}
        </Text>
      </Box>
    );
  }
  if (entry.role === "tool") {
    return (
      <Box flexDirection="column" marginLeft={2}>
        <Text color="yellow"> ⚡ {entry.toolName}</Text>
        {entry.content && <Text color="gray"> {entry.content}</Text>}
      </Box>
    );
  }
  return (
    <Box>
      <Text color="gray"> {entry.content}</Text>
    </Box>
  );
}

function StatusBar({
  status,
  running,
  tokenCount,
  messageCount,
}: {
  status: string;
  running: boolean;
  tokenCount: number;
  messageCount: number;
}): React.ReactElement {
  const statusColor = status === "running" ? "yellow" : status === "error" ? "red" : "green";
  const statusIcon = running ? "●" : "○";
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text color={statusColor as any}>
        {statusIcon} {status}
      </Text>
      <Text>
        {" "}
        | msgs: {messageCount} | tokens: ~{tokenCount}
      </Text>
    </Box>
  );
}

function InputBox({
  input,
  running,
  ctrlCCount,
}: {
  input: string;
  running: boolean;
  ctrlCCount: number;
}): React.ReactElement {
  return (
    <Box borderStyle="round" borderColor={running ? "yellow" : "blue"} paddingX={1}>
      <Text bold color="blue">
        {"> "}
      </Text>
      <Text>{input}</Text>
      <Text color="gray">{"▋"}</Text>
      {ctrlCCount > 0 && <Text color="red"> (Ctrl+C again to exit)</Text>}
    </Box>
  );
}
