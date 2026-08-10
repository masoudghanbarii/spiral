import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { StateManager } from "../src/managers/state.js";
import { StatusManager } from "../src/managers/status.js";
import { HarnessState, Feature } from "../src/models.js";

let tmpDir: string;

async function setup(): Promise<{ config: Config; tmpDir: string }> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  const config = new Config({ spiralDir: tmpDir });
  config.stateFile = path.join(tmpDir, "state.json");
  config.statusFile = path.join(tmpDir, "status.json");
  return { config, tmpDir };
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("StateManager", () => {
  beforeEach(async () => await setup());
  afterEach(async () => await cleanup());

  it("saves and loads state", async () => {
    const { config } = await setup();
    const sm = new StateManager(config);
    const s = new HarnessState();
    s.features = [new Feature({ name: "f1" })];
    await sm.save(s);
    const loaded = await sm.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.features.length).toBe(1);
    expect(loaded!.features[0]!.name).toBe("f1");
  });

  it("returns null when no state file", async () => {
    const { config } = await setup();
    const sm = new StateManager(config);
    expect(await sm.load()).toBeNull();
  });

  it("reset removes state file", async () => {
    const { config } = await setup();
    const sm = new StateManager(config);
    await sm.save(new HarnessState());
    await sm.reset();
    expect(await sm.load()).toBeNull();
  });
});

describe("StatusManager", () => {
  beforeEach(async () => await setup());
  afterEach(async () => await cleanup());

  it("writes and reads status", async () => {
    const { config } = await setup();
    const sm = new StatusManager(config);
    await sm.write({ loop: "agent", phase: "llm_wait", feature: "f1", mode: "run" });
    const data = await sm.read();
    expect(data).not.toBeNull();
    expect(data!.loop).toBe("agent");
    expect(data!.phase).toBe("llm_wait");
    expect(data!.pid).toBe(process.pid);
  });

  it("returns null when no status file", async () => {
    const { config } = await setup();
    const sm = new StatusManager(config);
    expect(await sm.read()).toBeNull();
  });

  it("clear removes status file", async () => {
    const { config } = await setup();
    const sm = new StatusManager(config);
    await sm.write({ loop: "agent", phase: "start", feature: "", mode: "run" });
    await sm.clear();
    expect(await sm.read()).toBeNull();
  });
});
