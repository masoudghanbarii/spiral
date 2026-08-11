import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";

let tmpDir: string;

async function setup(): Promise<string> {
  tmpDir = path.join(os.tmpdir(), `spiral-cfg-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(tmpDir, { recursive: true });
  return tmpDir;
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("Config (expanded)", () => {
  beforeEach(async () => {
    await setup();
  });
  afterEach(cleanup);

  it("reads env int vars", () => {
    process.env.SPIRAL_MAX_AGENT_ITERATIONS = "5";
    process.env.SPIRAL_MAX_VERIFICATION_RETRIES = "2";
    const c = new Config();
    expect(c.maxAgentIterations).toBe(5);
    expect(c.maxVerificationRetries).toBe(2);
    delete process.env.SPIRAL_MAX_AGENT_ITERATIONS;
    delete process.env.SPIRAL_MAX_VERIFICATION_RETRIES;
  });

  it("reads env float vars", () => {
    process.env.SPIRAL_WATCH_POLL_INTERVAL_S = "0.5";
    const c = new Config();
    expect(c.watchPollIntervalS).toBe(0.5);
    delete process.env.SPIRAL_WATCH_POLL_INTERVAL_S;
  });

  it("reads env bool vars", () => {
    process.env.SPIRAL_AUTO_APPROVE = "true";
    process.env.SPIRAL_STREAM = "1";
    const c = new Config();
    expect(c.autoApprove).toBe(true);
    expect(c.streamEnabled).toBe(true);
    delete process.env.SPIRAL_AUTO_APPROVE;
    delete process.env.SPIRAL_STREAM;
  });

  it("loadConfigFile applies values", async () => {
    const cfg = path.join(tmpDir, "config.json");
    await writeFile(
      cfg,
      JSON.stringify({ model: "gpt-4o", autoApprove: true, llmProvider: "openai", agentMode: "bypass" }),
      "utf-8",
    );
    const c = new Config({});
    await c.loadConfigFile(cfg);
    expect(c.model).toBe("gpt-4o");
    expect(c.autoApprove).toBe(true);
    expect(c.llmProvider).toBe("openai");
    expect(c.agentMode).toBe("bypass");
  });

  it("loadConfigFile throws for bad file", async () => {
    const cfg = path.join(tmpDir, "bad.json");
    await writeFile(cfg, "not json", "utf-8");
    const c = new Config();
    await expect(c.loadConfigFile(cfg)).rejects.toThrow("Cannot read config file");
  });

  it("validate returns anthropic key error", () => {
    const c = new Config({ llmProvider: "anthropic" });
    expect(c.validate()).toEqual(
      expect.arrayContaining([expect.stringContaining("Anthropic provider requires an API key")]),
    );
  });

  it("validate returns openai key error", () => {
    const c = new Config({ llmProvider: "openai" });
    expect(c.validate()).toEqual(
      expect.arrayContaining([expect.stringContaining("OpenAI provider requires an API key")]),
    );
  });

  it("validate small context window", () => {
    const c = new Config({ contextWindowTokens: 100 });
    expect(c.validate()).toEqual(
      expect.arrayContaining([expect.stringContaining("very small")]),
    );
  });

  it("validate bad permission level", () => {
    const c = new Config({ permissions: { read_file: "bogus" } });
    expect(c.validate()).toEqual(
      expect.arrayContaining([expect.stringContaining("Invalid permission level")]),
    );
  });

  it("validate bad agent mode", () => {
    const c = new Config({ agentMode: "bogus" });
    expect(c.validate()).toEqual(
      expect.arrayContaining([expect.stringContaining("Invalid agentMode")]),
    );
  });

  it("validate max iterations", () => {
    const c = new Config({ maxAgentIterations: 0 });
    expect(c.validate()).toEqual(
      expect.arrayContaining([expect.stringContaining("must be >= 1")]),
    );
  });

  it("validate autoApprove + ask conflict", () => {
    const c = new Config({ autoApprove: true, permissions: { write_file: "ask" } });
    expect(c.validate()).toEqual(
      expect.arrayContaining([expect.stringContaining("autoApprove is true")]),
    );
  });

  it("validate returns empty when valid", () => {
    const c = new Config();
    expect(c.validate()).toEqual([]);
  });
});
