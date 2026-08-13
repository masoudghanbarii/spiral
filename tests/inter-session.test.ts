import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolRegistry } from "../src/tools/registry.js";
import { Config } from "../src/config.js";
import { ProjectManager } from "../src/managers/project.js";
import { PermissionManager } from "../src/managers/permissions.js";
import { MemoryManager } from "../src/managers/memory.js";
import type { SessionBridge } from "../src/tools/session-bridge.js";

// Mock managers
const mockConfig = {
  projectDir: "/tmp/test-spiral",
  skillsDir: "/tmp/test-spiral/skills",
} as unknown as Config;

const mockProject = {
  readFile: vi.fn().mockResolvedValue(""),
  writeFile: vi.fn().mockResolvedValue(undefined),
  editFile: vi.fn().mockResolvedValue("ok"),
  grep: vi.fn().mockResolvedValue([]),
  glob: vi.fn().mockResolvedValue([]),
  runCommand: vi.fn().mockResolvedValue({ stdout: "", stderr: "" }),
  getProjectContext: vi.fn().mockResolvedValue({}),
} as unknown as ProjectManager;

const mockPerms = {
  shouldExecute: vi.fn().mockResolvedValue([true, ""]),
  addApproved: vi.fn(),
} as unknown as PermissionManager;

const mockMemory = {} as MemoryManager;

describe("Inter-session tools", () => {
  let tools: ToolRegistry;
  let bridgeCalls: {
    listSessions: { id: string; name: string }[];
    pushLogEntries: { targetId: string; entry: { kind: string; text: string } }[];
    pushContextMessages: { targetId: string; role: string; content: string }[];
    linkedGroups: { sessionA: string; sessionB: string }[];
  };

  beforeEach(() => {
    bridgeCalls = {
      listSessions: [
        { id: "s1", name: "#1 - hey" },
        { id: "s2", name: "#2 - hey" },
      ],
      pushLogEntries: [],
      pushContextMessages: [],
      linkedGroups: [],
    };

    const bridge: SessionBridge = {
      listSessions: () => bridgeCalls.listSessions,
      getCurrentSessionId: () => "s1",
      pushLogEntry: (targetId, entry) => {
        bridgeCalls.pushLogEntries.push({ targetId, entry });
        return bridgeCalls.listSessions.some((s) => s.id === targetId);
      },
      pushContextMessage: (targetId, role, content) => {
        bridgeCalls.pushContextMessages.push({ targetId, role, content });
        return true;
      },
      linkSessions: (sessionA, sessionB) => {
        bridgeCalls.linkedGroups.push({ sessionA, sessionB });
        return true;
      },
    };

    tools = new ToolRegistry(mockConfig, mockProject, mockPerms, "normal", mockMemory);
    tools.setSessionBridge(bridge);
  });

  it("list_sessions returns all sessions with current marked", async () => {
    const result = await tools.execute("list_sessions", {});
    expect(result).toContain("s1: #1 - hey");
    expect(result).toContain("s2: #2 - hey");
    expect(result).toContain("* s1"); // current session marked
  });

  it("send_to_session with correct args (Ollama object format)", async () => {
    // Ollama returns arguments as an object, not a JSON string
    const result = await tools.execute("send_to_session", {
      target_session: "s2",
      message: "hello from s1",
    });

    expect(result).toContain("delivered");
    expect(result).toContain("s2");
    expect(bridgeCalls.pushLogEntries).toHaveLength(1);
    expect(bridgeCalls.pushLogEntries[0]).toEqual({
      targetId: "s2",
      entry: { kind: "system", text: "📨 Message from s1: hello from s1" },
    });
    expect(bridgeCalls.pushContextMessages).toHaveLength(1);
    expect(bridgeCalls.pushContextMessages[0]).toEqual({
      targetId: "s2",
      role: "system",
      content: "[Message from session s1]: hello from s1",
    });
  });

  it("send_to_session accepts session_id alias", async () => {
    const result = await tools.execute("send_to_session", {
      session_id: "s2",
      message: "test",
    });
    expect(result).toContain("delivered");
  });

  it("send_to_session accepts session name as target", async () => {
    const result = await tools.execute("send_to_session", {
      target_session: "#2 - hey",
      message: "test",
    });
    expect(result).toContain("delivered");
  });

  it("send_to_session fails with missing args", async () => {
    const result = await tools.execute("send_to_session", {});
    expect(result).toContain("Error");
    expect(result).toContain("target_session");
  });

  it("send_to_session fails with non-existent session", async () => {
    const result = await tools.execute("send_to_session", {
      target_session: "s99",
      message: "test",
    });
    expect(result).toContain("Error");
    expect(result).toContain("not found");
  });

  it("link_sessions with correct args", async () => {
    const result = await tools.execute("link_sessions", {
      session_a: "s1",
      session_b: "s2",
    });
    expect(result).toContain("Linked");
    expect(result).toContain("s1");
    expect(result).toContain("s2");
    expect(bridgeCalls.linkedGroups).toHaveLength(1);
    expect(bridgeCalls.linkedGroups[0]).toEqual({
      sessionA: "s1",
      sessionB: "s2",
    });
  });

  it("link_sessions fails with same session", async () => {
    const result = await tools.execute("link_sessions", {
      session_a: "s1",
      session_b: "s1",
    });
    expect(result).toContain("Error");
  });

  it("link_sessions fails with missing args", async () => {
    const result = await tools.execute("link_sessions", {});
    expect(result).toContain("Error");
    expect(result).toContain("session_a");
  });
});

describe("Tool call argument parsing (Ollama vs OpenAI format)", () => {
  // This simulates what happens in runAgentTurn when parsing tool calls
  it("handles Ollama object arguments", () => {
    // Ollama returns: { "target_session": "s2", "message": "hello" }
    const ollamaArgs = { target_session: "s2", message: "hello" } as unknown as string;

    let funcArgs: Record<string, unknown> = {};
    const rawArgs = ollamaArgs;

    try {
      if (typeof rawArgs === "string") {
        funcArgs = JSON.parse(rawArgs) as Record<string, unknown>;
      } else if (typeof rawArgs === "object") {
        funcArgs = rawArgs as Record<string, unknown>;
      }
    } catch {
      funcArgs = {};
    }

    expect(funcArgs).toEqual({ target_session: "s2", message: "hello" });
    expect(funcArgs["target_session"]).toBe("s2");
    expect(funcArgs["message"]).toBe("hello");
  });

  it("handles OpenAI string arguments", () => {
    // OpenAI returns: '{"target_session": "s2", "message": "hello"}'
    const openaiArgs = '{"target_session": "s2", "message": "hello"}';

    let funcArgs: Record<string, unknown> = {};
    const rawArgs = openaiArgs;

    try {
      if (typeof rawArgs === "string") {
        funcArgs = JSON.parse(rawArgs) as Record<string, unknown>;
      } else if (typeof rawArgs === "object") {
        funcArgs = rawArgs as Record<string, unknown>;
      }
    } catch {
      funcArgs = {};
    }

    expect(funcArgs).toEqual({ target_session: "s2", message: "hello" });
  });

  it("handles empty string arguments", () => {
    let funcArgs: Record<string, unknown> = {};
    const rawArgs = "";

    try {
      if (typeof rawArgs === "string") {
        funcArgs = JSON.parse(rawArgs) as Record<string, unknown>;
      } else if (typeof rawArgs === "object") {
        funcArgs = rawArgs as Record<string, unknown>;
      }
    } catch {
      funcArgs = {};
    }

    // JSON.parse("") throws, so funcArgs should be {}
    expect(funcArgs).toEqual({});
  });
});

describe("Full integration: Ollama API response → tool execution", () => {
  let tools: ToolRegistry;
  let bridgeCalls: { pushContextMessages: { targetId: string; content: string }[] };

  beforeEach(() => {
    bridgeCalls = { pushContextMessages: [] };

    const bridge: SessionBridge = {
      listSessions: () => [
        { id: "s1", name: "#1 - hey" },
        { id: "s2", name: "#2 - hey" },
      ],
      getCurrentSessionId: () => "s1",
      pushLogEntry: () => true,
      pushContextMessage: (targetId, _role, content) => {
        bridgeCalls.pushContextMessages.push({ targetId, content });
        return true;
      },
      linkSessions: () => true,
    };

    tools = new ToolRegistry(mockConfig, mockProject, mockPerms, "normal", mockMemory);
    tools.setSessionBridge(bridge);
  });

  it("simulates full Ollama response flow for send_to_session", async () => {
    // This is exactly what Ollama returns for a tool call
    const ollamaResponse = {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id: "call_abc123",
            function: {
              name: "send_to_session",
              // Ollama returns arguments as an object, NOT a JSON string
              arguments: {
                target_session: "s2",
                message: "the user said: hey, how are you? and 1+1=2",
              },
            },
          },
        ],
      },
      done: true,
    };

    // Parse tool calls like runAgentTurn does
    const toolCalls = ollamaResponse.message.tool_calls ?? [];
    expect(toolCalls.length).toBe(1);

    const tc = toolCalls[0]!;
    const funcName = tc.function.name;
    let funcArgs: Record<string, unknown> = {};

    const rawArgs = tc.function.arguments ?? "";
    if (typeof rawArgs === "string") {
      funcArgs = JSON.parse(rawArgs) as Record<string, unknown>;
    } else if (typeof rawArgs === "object") {
      funcArgs = rawArgs as Record<string, unknown>;
    }

    expect(funcName).toBe("send_to_session");
    expect(funcArgs).toEqual({
      target_session: "s2",
      message: "the user said: hey, how are you? and 1+1=2",
    });

    // Execute the tool
    const result = await tools.execute(funcName, funcArgs);
    expect(result).toContain("delivered");
    expect(result).toContain("s2");

    // Verify the context message was pushed to session s2
    expect(bridgeCalls.pushContextMessages).toHaveLength(1);
    expect(bridgeCalls.pushContextMessages[0]!.targetId).toBe("s2");
    expect(bridgeCalls.pushContextMessages[0]!.content).toContain("the user said");
    expect(bridgeCalls.pushContextMessages[0]!.content).toContain("1+1=2");
  });

  it("simulates full Ollama response flow for link_sessions", async () => {
    const ollamaResponse = {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id: "call_def456",
            function: {
              name: "link_sessions",
              arguments: {
                session_a: "s1",
                session_b: "s2",
              },
            },
          },
        ],
      },
      done: true,
    };

    const toolCalls = ollamaResponse.message.tool_calls ?? [];
    const tc = toolCalls[0]!;
    let funcArgs: Record<string, unknown> = {};

    const rawArgs = tc.function.arguments ?? "";
    if (typeof rawArgs === "string") {
      funcArgs = JSON.parse(rawArgs) as Record<string, unknown>;
    } else if (typeof rawArgs === "object") {
      funcArgs = rawArgs as Record<string, unknown>;
    }

    const result = await tools.execute(tc.function.name, funcArgs);
    expect(result).toContain("Linked");
    expect(result).toContain("s1");
    expect(result).toContain("s2");
  });
});