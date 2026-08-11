import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { Harness } from "../src/harness.js";
import { HarnessState } from "../src/models.js";

let tmpDir: string;
let config: Config;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-harness-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir, projectDir: tmpDir, autoApprove: true });
  config.setProjectDir(tmpDir);
  config.tracesDir = path.join(tmpDir, "traces");
  config.stateFile = path.join(tmpDir, "state.json");
  config.statusFile = path.join(tmpDir, "status.json");
  config.memoryDir = path.join(tmpDir, "memory");
  await mkdir(path.join(tmpDir, "docs", "adr"), { recursive: true });
  await writeFile(config.adrPath, "# ADR\n## Feature A\ncontent\n**Status:** Pending\n", "utf-8");
  await writeFile(config.agentsPath, "# Agents", "utf-8");
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("Harness", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("setSessionId updates session", async () => {
    const harness = new Harness(config);
    await new Promise((r) => setTimeout(r, 100));
    harness.setSessionId("custom-session");
    expect(harness.session.sessionId).toBe("custom-session");
  });

  it("getLoopTiming returns null before run", async () => {
    const harness = new Harness(config);
    await new Promise((r) => setTimeout(r, 100));
    expect(harness.getLoopTiming()).toBeNull();
  });

  it("getLoopTiming works after run", async () => {
    const harness = new Harness(config);
    await new Promise((r) => setTimeout(r, 100));
    vi.spyOn(harness.llm, "generate").mockResolvedValue(
      '[{"name":"f1","description":"desc","adr_section":"Feature A"}]',
    );
    vi.spyOn(harness.llm, "chat").mockResolvedValue({
      message: { content: "FINAL_RESULT: done", tool_calls: [] },
    });
    vi.spyOn(harness.agent, "run").mockResolvedValue("FINAL_RESULT: done");
    vi.spyOn(harness.verifier, "run").mockResolvedValue([
      true,
      { status: "pass", score: 1, feedback: "ok", rubricBreakdown: {} },
    ]);

    await harness.run();
    const timing = harness.getLoopTiming();
    expect(timing).not.toBeNull();
    expect(timing!.features.length).toBeGreaterThan(0);
  });

  it("run completes a passing feature", async () => {
    const harness = new Harness(config);
    await new Promise((r) => setTimeout(r, 100));
    vi.spyOn(harness.llm, "generate").mockResolvedValue(
      '[{"name":"f1","description":"desc","adr_section":"Feature A"}]',
    );
    vi.spyOn(harness.agent, "run").mockResolvedValue("FINAL_RESULT: done");
    vi.spyOn(harness.verifier, "run").mockResolvedValue([
      true,
      { status: "pass", score: 1, feedback: "ok", rubricBreakdown: {} },
    ]);

    await harness.run();
    expect(harness.state!.completedFeatures).toContain("f1");
    expect(harness.state!.failedFeatures).not.toContain("f1");
  });

  it("run records failed feature", async () => {
    const harness = new Harness(config);
    await new Promise((r) => setTimeout(r, 100));
    vi.spyOn(harness.llm, "generate").mockResolvedValue(
      '[{"name":"f1","description":"desc","adr_section":"Feature A"}]',
    );
    vi.spyOn(harness.agent, "run").mockResolvedValue("some output");
    vi.spyOn(harness.verifier, "run").mockResolvedValue([
      false,
      { status: "fail", score: 0.1, feedback: "bad", rubricBreakdown: {} },
    ]);

    await harness.run();
    expect(harness.state!.failedFeatures).toContain("f1");
  });
});
