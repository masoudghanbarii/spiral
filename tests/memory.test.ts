import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { MemoryManager, ProjectMemory, SessionMemory } from "../src/managers/memory.js";

let tmpDir: string;
let config: Config;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-mem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir });
  config.memoryDir = path.join(tmpDir, "memory");
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("ProjectMemory", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("facts roundtrip", async () => {
    const pm = new ProjectMemory(config.memoryDir);
    expect(Object.keys(await pm.getFacts())).toHaveLength(0);
    await pm.addFact("framework", "FastAPI");
    expect((await pm.getFacts()).framework).toBe("FastAPI");
  });

  it("failures roundtrip", async () => {
    const pm = new ProjectMemory(config.memoryDir);
    await pm.addFailure({ feature: "auth", error: "timeout" });
    const failures = await pm.getFailures();
    expect(failures).toHaveLength(1);
  });

  it("context for prompt", async () => {
    const pm = new ProjectMemory(config.memoryDir);
    await pm.addFact("lang", "TypeScript");
    const ctx = await pm.getContextForPrompt();
    expect(ctx).toContain("TypeScript");
  });
});

describe("SessionMemory", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("auto session id", () => {
    const sm = new SessionMemory(config.memoryDir);
    expect(sm.sessionId).toBeTruthy();
  });

  it("custom session id", () => {
    const sm = new SessionMemory(config.memoryDir, "my-session");
    expect(sm.sessionId).toBe("my-session");
  });

  it("messages roundtrip", async () => {
    const sm = new SessionMemory(config.memoryDir, "test1");
    await sm.saveMessages([{ role: "user", content: "hello" }]);
    const msgs = await sm.getMessages();
    expect(msgs[0]!.content).toBe("hello");
  });

  it("state roundtrip", async () => {
    const sm = new SessionMemory(config.memoryDir, "test2");
    await sm.saveState({ features: ["f1"] });
    const state = (await sm.getState()) as { features?: string[] };
    expect(state?.features).toEqual(["f1"]);
  });
});

describe("MemoryManager", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("list sessions empty", async () => {
    const mm = new MemoryManager(config);
    expect(await mm.listSessions()).toHaveLength(0);
  });

  it("list sessions after creation", async () => {
    const mm = new MemoryManager(config);
    const sm = mm.createSession("s1");
    await sm.saveContext({ mode: "run", started: "2026-01-01" });
    await sm.saveState({ features: ["f1", "f2"], completed_features: ["f1"] });
    const sessions = await mm.listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.sessionId).toBe("s1");
    expect(sessions[0]!.completed).toBe(1);
  });

  it("delete session", async () => {
    const mm = new MemoryManager(config);
    const sm = mm.createSession("del");
    await sm.saveMessages([]);
    expect(await mm.deleteSession("del")).toBe(true);
    expect(await mm.listSessions()).toHaveLength(0);
  });
});
