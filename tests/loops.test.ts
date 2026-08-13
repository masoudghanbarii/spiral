import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { LLMClient } from "../src/llm.js";
import { ManagerRegistry } from "../src/managers/index.js";
import { AgentLoop } from "../src/loops/agent.js";
import { VerificationLoop } from "../src/loops/verifier.js";
import { EventDriver } from "../src/loops/event_driver.js";
import { EngineAnalysisLoop } from "../src/loops/engine.js";
import { Harness } from "../src/harness.js";
import { ToolRegistry } from "../src/tools/registry.js";
import { Feature, HarnessState } from "../src/models.js";

let tmpDir: string;
let config: Config;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-loop-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir, projectDir: tmpDir, autoApprove: true });
  config.setProjectDir(tmpDir);
  config.tracesDir = path.join(tmpDir, "traces");
  config.stateFile = path.join(tmpDir, "state.json");
  config.statusFile = path.join(tmpDir, "status.json");
  config.memoryDir = path.join(tmpDir, "memory");
  await mkdir(path.join(tmpDir, "docs", "adr"), { recursive: true });
  await writeFile(config.adrPath, "# ADR\n## Feature A\ntest\n**Status:** Pending\n", "utf-8");
  await writeFile(config.agentsPath, "# Agents", "utf-8");
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("LLMClient", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("delegates chat to provider", async () => {
    const c = new Config({ llmProvider: "ollama" });
    const client = new LLMClient(c);
    const mockResp = { message: { content: "hello", tool_calls: [] } };
    vi.spyOn(client["provider"], "chat").mockResolvedValue(mockResp);
    const result = await client.chat([{ role: "user", content: "hi" }]);
    expect(result.message.content).toBe("hello");
  });

  it("delegates generate to provider", async () => {
    const c = new Config({ llmProvider: "ollama" });
    const client = new LLMClient(c);
    vi.spyOn(client["provider"], "generate").mockResolvedValue("generated text");
    const result = await client.generate("prompt");
    expect(result).toBe("generated text");
  });

  it("delegates chatStream to provider", async () => {
    const c = new Config({ llmProvider: "ollama" });
    const client = new LLMClient(c);
    vi.spyOn(client["provider"], "chatStream").mockResolvedValue({
      message: { content: "streamed", tool_calls: [] },
    });
    const result = await client.chatStream([{ role: "user", content: "hi" }]);
    expect(result.message.content).toBe("streamed");
  });

  it("delegates extractJson to provider", () => {
    const c = new Config({ llmProvider: "ollama" });
    const client = new LLMClient(c);
    expect(client.extractJson('{"a":1}')).toEqual({ a: 1 });
  });
});

describe("AgentLoop", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("runs and returns FINAL_RESULT", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const tools = new ToolRegistry(config, managers.project, managers.permissions, "normal");
    const agent = new AgentLoop(config, managers, llm, tools, "normal");
    // Wait for async init
    await new Promise((r) => setTimeout(r, 100));

    vi.spyOn(llm, "chat").mockResolvedValue({
      message: { content: "FINAL_RESULT: done" },
    });

    const feature = new Feature({ name: "test", description: "desc", adr_section: "A" });
    const result = await agent.run(feature);
    expect(result).toContain("FINAL_RESULT");
  });

  it("handles tool calls", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const tools = new ToolRegistry(config, managers.project, managers.permissions, "normal");
    const agent = new AgentLoop(config, managers, llm, tools, "normal");
    await new Promise((r) => setTimeout(r, 100));

    vi.spyOn(llm, "chat")
      .mockResolvedValueOnce({
        message: {
          content: "",
          tool_calls: [
            { id: "tc1", function: { name: "read_file", arguments: '{"path":"AGENTS.md"}' } },
          ],
        },
      })
      .mockResolvedValueOnce({
        message: { content: "FINAL_RESULT: done" },
      });

    const feature = new Feature({ name: "test", description: "desc", adr_section: "A" });
    const result = await agent.run(feature);
    expect(result).toContain("FINAL_RESULT");
  });

  it("returns max iterations when no FINAL_RESULT", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    config.maxAgentIterations = 2;
    const tools = new ToolRegistry(config, managers.project, managers.permissions, "normal");
    const agent = new AgentLoop(config, managers, llm, tools, "normal");
    await new Promise((r) => setTimeout(r, 100));

    vi.spyOn(llm, "chat").mockResolvedValue({
      message: { content: "thinking..." },
    });

    const feature = new Feature({ name: "test", description: "desc", adr_section: "A" });
    const result = await agent.run(feature);
    expect(result).toContain("Max iterations");
  });
});

describe("VerificationLoop", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("passes when grade returns pass", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const tools = new ToolRegistry(config, managers.project, managers.permissions, "normal");
    const verifier = new VerificationLoop(config, managers, llm, tools);

    vi.spyOn(llm, "generate").mockResolvedValue('{"status":"pass","score":0.95,"feedback":"good"}');

    const feature = new Feature({ name: "test", description: "desc", adr_section: "A" });
    const [passed, grade] = await verifier.run(feature, "output");
    expect(passed).toBe(true);
    expect(grade.score).toBe(0.95);
  });

  it("fails when grade returns fail", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    config.maxVerificationRetries = 1;
    const tools = new ToolRegistry(config, managers.project, managers.permissions, "normal");
    const verifier = new VerificationLoop(config, managers, llm, tools);

    vi.spyOn(llm, "generate").mockResolvedValue('{"status":"fail","score":0.2,"feedback":"bad"}');

    const feature = new Feature({ name: "test", description: "desc", adr_section: "A" });
    const [passed, grade] = await verifier.run(feature, "output");
    expect(passed).toBe(false);
    expect(grade.status).toBe("fail");
  });
});

describe("EventDriver", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("getNextFeature returns current feature", () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const ed = new EventDriver(config, managers, llm);
    const state = new HarnessState();
    state.features = [new Feature({ name: "f1" }), new Feature({ name: "f2" })];
    expect(ed.getNextFeature(state)!.name).toBe("f1");
  });

  it("hasMoreWork checks index", () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const ed = new EventDriver(config, managers, llm);
    const state = new HarnessState();
    state.features = [new Feature({ name: "f1" })];
    expect(ed.hasMoreWork(state)).toBe(true);
    state.currentFeatureIndex = 1;
    expect(ed.hasMoreWork(state)).toBe(false);
  });

  it("onFeatureComplete advances index", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const ed = new EventDriver(config, managers, llm);
    const state = new HarnessState();
    state.features = [new Feature({ name: "f1", adr_section: "Feature A" })];
    await ed.onFeatureComplete(state, state.features[0]!);
    expect(state.currentFeatureIndex).toBe(1);
    expect(state.completedFeatures).toContain("f1");
  });

  it("onFeatureFailed advances index", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const ed = new EventDriver(config, managers, llm);
    const state = new HarnessState();
    state.features = [new Feature({ name: "f1" })];
    await ed.onFeatureFailed(state, state.features[0]!);
    expect(state.currentFeatureIndex).toBe(1);
    expect(state.failedFeatures).toContain("f1");
  });

  it("generateEventsFromAdr returns features", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const ed = new EventDriver(config, managers, llm);

    vi.spyOn(llm, "generate").mockResolvedValue(
      '[{"name":"f1","description":"test","adr_section":"Feature A"}]',
    );

    const features = await ed.generateEventsFromAdr();
    expect(features).toHaveLength(1);
    expect(features[0]!.name).toBe("f1");
  });
});

describe("EngineAnalysisLoop", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("shouldAnalyze returns true first time", () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const engine = new EngineAnalysisLoop(config, managers, llm);
    expect(engine.shouldAnalyze(new HarnessState())).toBe(true);
  });

  it("shouldAnalyze at interval", () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    config.engineAnalysisInterval = 5;
    const engine = new EngineAnalysisLoop(config, managers, llm);
    engine.analysisCount = 1;
    const state = new HarnessState();
    state.completedFeatures = ["f1", "f2", "f3", "f4", "f5"];
    expect(engine.shouldAnalyze(state)).toBe(true);
  });

  it("analyze returns improvements", async () => {
    const managers = new ManagerRegistry(config);
    const llm = new LLMClient(config);
    const engine = new EngineAnalysisLoop(config, managers, llm);

    vi.spyOn(llm, "generate").mockResolvedValue(
      '{"improvements":["fix rubric"],"prompt_changes":"new prompt","rubric_changes":{"k":"v"},"tool_changes":{"t":"v"}}',
    );

    const state = new HarnessState();
    const improvements = await engine.analyze(state);
    expect(improvements.length).toBeGreaterThan(0);
    expect(state.systemPrompt).toBe("new prompt");
    expect(state.totalEngineAnalyses).toBe(1);
  });
});

describe("Harness", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("initializes with ADR features", async () => {
    const managers = new ManagerRegistry(config);
    vi.spyOn(managers.project, "getProjectContext").mockResolvedValue({
      adr: "# ADR\n## Feature A\ntest",
      agents_md: "# Agents",
      files: [],
      project_dir: tmpDir,
    });
    vi.spyOn(managers.project, "readAdr").mockResolvedValue("# ADR\n## Feature A\ntest");
    vi.spyOn(managers.project, "readAgentsMd").mockResolvedValue("# Agents");

    // Mock LLMClient globally so Harness's internal client is mocked too
    vi.spyOn(LLMClient.prototype, "generate").mockResolvedValue(
      '[{"name":"f1","description":"test","adr_section":"Feature A"}]',
    );
    vi.spyOn(LLMClient.prototype, "extractJson").mockReturnValue(
      [{ name: "f1", description: "test", adr_section: "Feature A" }],
    );
    const harness = new Harness(config);
    await new Promise((r) => setTimeout(r, 300));
    await harness.initialize();
    expect(harness.state).not.toBeNull();
    vi.restoreAllMocks();
  }, 15000);

  it("resumes from existing state", async () => {
    const managers = new ManagerRegistry(config);
    const state = new HarnessState();
    state.features = [new Feature({ name: "f1" })];
    state.completedFeatures = ["f1"];
    state.currentFeatureIndex = 1;
    await managers.state.save(state);

    const harness = new Harness(config);
    await new Promise((r) => setTimeout(r, 200));
    await harness.initialize();
    expect(harness.state!.completedFeatures).toContain("f1");
  });
});
