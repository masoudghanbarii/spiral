import { describe, it, expect } from "vitest";
import { Config } from "../src/config.js";

describe("Config", () => {
  it("creates with defaults", () => {
    const c = new Config();
    expect(c.ollamaBaseUrl).toBe("http://localhost:11434");
    expect(c.model).toBe("deepseek-v4-flash:cloud");
    expect(c.maxAgentIterations).toBe(50);
    expect(c.maxVerificationRetries).toBe(3);
    expect(c.agentMode).toBe("normal");
    expect(c.llmProvider).toBe("ollama");
  });

  it("accepts overrides", () => {
    const c = new Config({ model: "gpt-4", maxAgentIterations: 10 });
    expect(c.model).toBe("gpt-4");
    expect(c.maxAgentIterations).toBe(10);
  });

  it("setProjectDir updates paths", () => {
    const c = new Config();
    c.setProjectDir("/tmp/myproject");
    expect(c.projectDir).toBe("/tmp/myproject");
    expect(c.adrPath).toContain("myproject");
    expect(c.agentsPath).toContain("myproject");
  });

  it("reads env vars", () => {
    process.env.SPIRAL_MODEL = "claude-3-opus";
    const c = new Config();
    expect(c.model).toBe("claude-3-opus");
    delete process.env.SPIRAL_MODEL;
  });
});
