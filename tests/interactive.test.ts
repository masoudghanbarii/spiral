import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { InteractiveMode } from "../src/interactive.js";
import { TraceManager } from "../src/managers/traces.js";

let tmpDir: string;
let config: Config;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-int-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir });
  config.tracesDir = path.join(tmpDir, "traces");
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("InteractiveMode", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("hasInput false initially", () => {
    const im = new InteractiveMode();
    expect(im.hasInput).toBe(false);
  });

  it("getInput returns null when empty", () => {
    const im = new InteractiveMode();
    expect(im.getInput()).toBeNull();
  });

  it("isPaused false initially", () => {
    const im = new InteractiveMode();
    expect(im.isPaused).toBe(false);
  });

  it("shouldStop false initially", () => {
    const im = new InteractiveMode();
    expect(im.shouldStop).toBe(false);
  });

  it("getPendingMessage returns null when no input", () => {
    const im = new InteractiveMode();
    expect(im.getPendingMessage()).toBeNull();
  });

  it("getPendingMessage returns user message", () => {
    const im = new InteractiveMode();
    (im as unknown as { queue: string[] }).queue.push("hello");
    const msg = im.getPendingMessage();
    expect(msg).toEqual({ role: "user", content: "hello" });
  });

  it("handleInput queues user line", () => {
    const im = new InteractiveMode();
    (im as unknown as { handleInput: (l: string) => void }).handleInput("hello world");
    expect(im.hasInput).toBe(true);
  });

  it("handleInput records trace", async () => {
    const traces = new TraceManager(config);
    const im = new InteractiveMode(traces);
    (im as unknown as { handleInput: (l: string) => void }).handleInput("hello");
    await new Promise((r) => setTimeout(r, 20));
    expect(traces.getSessionTraces().length).toBeGreaterThan(0);
  });

  it("handleCommand pauses", () => {
    const im = new InteractiveMode();
    (im as unknown as { handleCommand: (c: string) => void }).handleCommand("/pause");
    expect(im.isPaused).toBe(true);
  });

  it("handleCommand resumes", () => {
    const im = new InteractiveMode();
    (im as unknown as { handleCommand: (c: string) => void }).handleCommand("/pause");
    (im as unknown as { handleCommand: (c: string) => void }).handleCommand("/resume");
    expect(im.isPaused).toBe(false);
  });

  it("handleCommand stops", () => {
    const im = new InteractiveMode();
    (im as unknown as { handleCommand: (c: string) => void }).handleCommand("/stop");
    expect(im.shouldStop).toBe(true);
  });
});
