import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { MemoryManager } from "../src/managers/memory.js";
import { SessionManager } from "../src/managers/sessions.js";

let tmpDir: string;
let config: Config;
let mm: MemoryManager;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-sess-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir });
  config.memoryDir = path.join(tmpDir, "memory");
  mm = new MemoryManager(config);
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("SessionManager", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("listSessions delegates to MemoryManager", async () => {
    const sm = new SessionManager(mm);
    expect(await sm.listSessions()).toEqual([]);
  });

  it("forkSession creates new session with messages", async () => {
    const sm = new SessionManager(mm);
    const source = mm.createSession("source1");
    await source.saveMessages([{ role: "user", content: "hello" }]);
    await source.saveContext({ mode: "run" });

    const fork = await sm.forkSession("source1");
    expect(fork.exists()).toBe(true);
    const msgs = await fork.getMessages();
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.content).toBe("hello");
  });

  it("forkSession with fromPoint truncates messages", async () => {
    const sm = new SessionManager(mm);
    const source = mm.createSession("source2");
    await source.saveMessages([
      { role: "user", content: "msg1" },
      { role: "assistant", content: "reply1" },
      { role: "user", content: "msg2" },
    ]);

    const fork = await sm.forkSession("source2", 1);
    const msgs = await fork.getMessages();
    expect(msgs).toHaveLength(2);
  });

  it("forkSession throws for nonexistent session", async () => {
    const sm = new SessionManager(mm);
    await expect(sm.forkSession("nonexistent")).rejects.toThrow("does not exist");
  });

  it("exportSession redacts sensitive data", async () => {
    const sm = new SessionManager(mm);
    const source = mm.createSession("export1");
    await source.saveMessages([{ role: "user", content: "hello" }]);
    await source.saveContext({ apiKey: "secret-key-123", mode: "run" });

    const exported = await sm.exportSession("export1");
    expect(exported.sessionId).toBe("export1");
    expect(exported.version).toBe("1.0.0");
    expect(exported.context.apiKey).toBe("[REDACTED]");
    expect(exported.context.mode).toBe("run");
  });

  it("exportSession throws for nonexistent", async () => {
    const sm = new SessionManager(mm);
    await expect(sm.exportSession("nope")).rejects.toThrow("does not exist");
  });

  it("importSession creates new session", async () => {
    const sm = new SessionManager(mm);
    const imported = await sm.importSession({
      sessionId: "external-session",
      messages: [{ role: "user", content: "imported msg" }],
      state: { features: ["f1"] },
      context: { mode: "run" },
      summary: "",
      exportedAt: "2026-01-01T00:00:00Z",
      version: "1.0.0",
    });
    expect(imported.exists()).toBe(true);
    const msgs = await imported.getMessages();
    expect(msgs[0]!.content).toBe("imported msg");
  });

  it("importSession throws for invalid data", async () => {
    const sm = new SessionManager(mm);
    await expect(
      sm.importSession({
        sessionId: "",
        messages: [],
        state: null,
        context: {},
        summary: "",
        exportedAt: "",
        version: "",
      }),
    ).rejects.toThrow("Invalid session export");
  });

  it("shareSession returns JSON string", async () => {
    const sm = new SessionManager(mm);
    const source = mm.createSession("share1");
    await source.saveMessages([{ role: "user", content: "share me" }]);

    const shared = await sm.shareSession("share1");
    const parsed = JSON.parse(shared);
    expect(parsed.sessionId).toBe("share1");
    expect(parsed.messages[0].content).toBe("share me");
  });

  it("branchSession creates child session", async () => {
    const sm = new SessionManager(mm);
    const source = mm.createSession("parent1");
    await source.saveMessages([{ role: "user", content: "parent msg" }]);
    await source.saveContext({ mode: "run" });

    const branch = await sm.branchSession("parent1", "feature-x");
    expect(branch.exists()).toBe(true);
    const ctx = await branch.getContext();
    expect(ctx.branchOf).toBe("parent1");
    expect(ctx.branchName).toBe("feature-x");
  });

  it("branchSession registers branch", async () => {
    const sm = new SessionManager(mm);
    const source = mm.createSession("parent2");
    await source.saveMessages([]);

    await sm.branchSession("parent2", "dev");
    const branches = sm.listBranches("parent2");
    expect(branches).toHaveLength(1);
    expect(branches[0]!.name).toBe("dev");
  });

  it("branchSession throws for nonexistent", async () => {
    const sm = new SessionManager(mm);
    await expect(sm.branchSession("nope", "test")).rejects.toThrow("does not exist");
  });

  it("listBranches returns empty for unknown parent", () => {
    const sm = new SessionManager(mm);
    expect(sm.listBranches("unknown")).toEqual([]);
  });
});
