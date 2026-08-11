import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { StatusManager } from "../src/managers/status.js";
import { StateManager } from "../src/managers/state.js";
import { TraceManager } from "../src/managers/traces.js";
import { HarnessState, Feature, TraceEntry } from "../src/models.js";

let tmpDir: string;
let config: Config;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-watch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir, projectDir: tmpDir });
  config.tracesDir = path.join(tmpDir, "traces");
  config.stateFile = path.join(tmpDir, "state.json");
  config.statusFile = path.join(tmpDir, "status.json");
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("Watch (snapshot loading)", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("loadSnapshot returns empty when no files", async () => {
    const { loadSnapshot } = await import("../src/watch.js");
    const snap = await loadSnapshot(config);
    expect(snap.status).toBeNull();
    expect(snap.state).toBeNull();
    expect(snap.traces).toEqual([]);
    expect(snap.isAlive).toBe(false);
  });

  it("loadSnapshot reads status", async () => {
    const { loadSnapshot } = await import("../src/watch.js");
    const sm = new StatusManager(config);
    await sm.write({ loop: "agent", phase: "llm_wait", feature: "f1", mode: "run" });
    const snap = await loadSnapshot(config);
    expect(snap.status).not.toBeNull();
    expect(snap.status!.loop).toBe("agent");
  });

  it("loadSnapshot reads state", async () => {
    const { loadSnapshot } = await import("../src/watch.js");
    const stateMgr = new StateManager(config);
    const state = new HarnessState();
    state.features = [new Feature({ name: "f1" })];
    state.completedFeatures = ["f1"];
    await stateMgr.save(state);
    const snap = await loadSnapshot(config);
    expect(snap.state).not.toBeNull();
    expect(snap.state!.completedFeatures).toContain("f1");
  });

  it("loadSnapshot reads traces", async () => {
    const { loadSnapshot } = await import("../src/watch.js");
    const tm = new TraceManager(config);
    await tm.record(
      new TraceEntry({ event_type: "agent_step", loop_name: "agent", feature: "f1" }),
    );
    const snap = await loadSnapshot(config);
    expect(snap.traces.length).toBeGreaterThanOrEqual(1);
  });

  it("loadSnapshot detects alive pid", async () => {
    const { loadSnapshot } = await import("../src/watch.js");
    const sm = new StatusManager(config);
    await sm.write({ loop: "agent", phase: "start", feature: "", mode: "run" });
    const snap = await loadSnapshot(config);
    expect(snap.isAlive).toBe(true);
  });
});
