import { describe, it, expect, beforeEach } from "vitest";
import { PluginManager, type Plugin } from "../src/plugins/index.js";
import type { Config } from "../src/config.js";
import type { ProjectManager } from "../src/managers/project.js";
import type { MemoryManager } from "../src/managers/memory.js";
import type { ToolDefinition } from "../src/types.js";
import { Config as ConfigImpl } from "../src/config.js";

const mockContext = {
  config: new ConfigImpl(),
  project: {} as ProjectManager,
  memory: {} as MemoryManager,
};

describe("PluginManager", () => {
  let pm: PluginManager;

  beforeEach(() => {
    pm = new PluginManager(mockContext);
  });

  it("registers a plugin", () => {
    pm.register({ name: "test", version: "1.0.0" });
    expect(pm.list()).toHaveLength(1);
    expect(pm.get("test")!.name).toBe("test");
  });

  it("throws on duplicate registration", () => {
    pm.register({ name: "test", version: "1.0.0" });
    expect(() => pm.register({ name: "test", version: "2.0.0" })).toThrow("already registered");
  });

  it("unregister removes plugin", () => {
    pm.register({ name: "test", version: "1.0.0" });
    pm.unregister("test");
    expect(pm.list()).toHaveLength(0);
    expect(pm.get("test")).toBeUndefined();
  });

  it("list returns all plugins", () => {
    pm.register({ name: "a", version: "1.0.0" });
    pm.register({ name: "b", version: "2.0.0" });
    expect(pm.list()).toHaveLength(2);
  });

  it("get returns undefined for unknown", () => {
    expect(pm.get("unknown")).toBeUndefined();
  });

  it("getTools returns empty initially", () => {
    expect(pm.getTools()).toEqual([]);
  });

  it("getTools returns plugin tools", () => {
    const tool: ToolDefinition = {
      type: "function",
      function: {
        name: "custom_tool",
        description: "A custom tool",
        parameters: { type: "object", properties: {} },
      },
    };
    pm.register({ name: "test", version: "1.0.0", tools: [tool] });
    expect(pm.getTools()).toHaveLength(1);
    expect(pm.getTools()[0]!.function.name).toBe("custom_tool");
  });

  it("getCommands returns plugin commands", () => {
    pm.register({
      name: "test",
      version: "1.0.0",
      commands: [{ name: "greet", description: "Greet", execute: async () => "hello" }],
    });
    expect(pm.getCommands()).toHaveLength(1);
    expect(pm.getCommands()[0]!.name).toBe("greet");
  });

  it("init is called on register", () => {
    let initialized = false;
    pm.register({
      name: "test",
      version: "1.0.0",
      init: () => {
        initialized = true;
      },
    });
    expect(initialized).toBe(true);
  });

  it("getTools merges from multiple plugins", () => {
    const tool1: ToolDefinition = {
      type: "function",
      function: { name: "t1", description: "T1", parameters: { type: "object", properties: {} } },
    };
    const tool2: ToolDefinition = {
      type: "function",
      function: { name: "t2", description: "T2", parameters: { type: "object", properties: {} } },
    };
    pm.register({ name: "a", version: "1.0.0", tools: [tool1] });
    pm.register({ name: "b", version: "1.0.0", tools: [tool2] });
    expect(pm.getTools()).toHaveLength(2);
  });
});
