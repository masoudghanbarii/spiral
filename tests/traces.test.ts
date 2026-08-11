import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { TraceManager } from "../src/managers/traces.js";
import { TraceEntry } from "../src/models.js";

let tmpDir: string;
let config: Config;

async function setup(): Promise<void> {
  tmpDir = path.join(os.tmpdir(), `spiral-tr-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir });
  config.tracesDir = path.join(tmpDir, "traces");
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("TraceManager", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("records entries", async () => {
    const tm = new TraceManager(config);
    await tm.record(new TraceEntry({ event_type: "agent_step", loop_name: "test", feature: "f1" }));
    expect(tm.getSessionTraces()).toHaveLength(1);
    expect(tm.getSessionTraces()[0]!.feature).toBe("f1");
  });

  it("filters by feature", async () => {
    const tm = new TraceManager(config);
    await tm.record(new TraceEntry({ event_type: "agent_step", loop_name: "test", feature: "f1" }));
    await tm.record(new TraceEntry({ event_type: "agent_step", loop_name: "test", feature: "f2" }));
    expect(tm.getTracesByFeature("f1")).toHaveLength(1);
    expect(tm.getTracesByFeature("f2")).toHaveLength(1);
  });

  it("filters by type", async () => {
    const tm = new TraceManager(config);
    await tm.record(new TraceEntry({ event_type: "agent_step", loop_name: "test", feature: "f1" }));
    await tm.record(new TraceEntry({ event_type: "tool_call", loop_name: "test", feature: "f1" }));
    expect(tm.getTracesByType("agent_step")).toHaveLength(1);
    expect(tm.getTracesByType("tool_call")).toHaveLength(1);
  });

  it("getEngineFeed returns formatted string", async () => {
    const tm = new TraceManager(config);
    await tm.record(
      new TraceEntry({
        event_type: "agent_step",
        loop_name: "agent",
        feature: "f1",
        data: { action: "start" },
      }),
    );
    const feed = tm.getEngineFeed();
    expect(feed).toContain("agent_step");
    expect(feed).toContain("agent");
    expect(feed).toContain("f1");
  });

  it("getEngineFeed empty when no traces", () => {
    const tm = new TraceManager(config);
    expect(tm.getEngineFeed()).toBe("");
  });

  it("loadSession reads from file", async () => {
    const tm = new TraceManager(config);
    await tm.record(new TraceEntry({ event_type: "agent_step", loop_name: "test", feature: "f1" }));
    const entries = await tm.loadSession(tm.sessionFile);
    expect(entries.length).toBeGreaterThanOrEqual(1);
  });

  it("loadSession returns empty for missing file", async () => {
    const tm = new TraceManager(config);
    const entries = await tm.loadSession("/nonexistent/path.jsonl");
    expect(entries).toEqual([]);
  });

  it("records multiple entries", async () => {
    const tm = new TraceManager(config);
    for (let i = 0; i < 10; i++) {
      await tm.record(
        new TraceEntry({
          event_type: "tool_call",
          loop_name: "agent",
          feature: `f${i}`,
        }),
      );
    }
    expect(tm.getSessionTraces()).toHaveLength(10);
  });
});
