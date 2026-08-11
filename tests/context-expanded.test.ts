import { describe, it, expect } from "vitest";
import { TokenCounter, ContextManager } from "../src/context.js";

describe("ContextManager (expanded)", () => {
  it("getModel returns model name", () => {
    const cm = new ContextManager(32768, 0.8, 4, "claude-3-opus");
    expect(cm.getModel()).toBe("claude-3-opus");
  });

  it("setModel updates model", () => {
    const cm = new ContextManager(32768, 0.8, 4, "gpt-4");
    cm.setModel("claude-3-opus");
    expect(cm.getModel()).toBe("claude-3-opus");
  });

  it("uses model window when model given", () => {
    const cm = new ContextManager(8192, 0.8, 4, "gpt-4o");
    expect(cm["window"]).toBe(128000);
  });

  it("falls back to provided window for unknown model", () => {
    const cm = new ContextManager(8192, 0.8, 4, "unknown-model");
    expect(cm["window"]).toBe(32768);
  });

  it("uses provided window for no model", () => {
    const cm = new ContextManager(32768, 0.8, 4);
    expect(cm["window"]).toBe(32768);
  });

  it("needsCompaction false when small", () => {
    const cm = new ContextManager(10000, 0.8, 4);
    expect(cm.needsCompaction([{ role: "user", content: "short" }])).toBe(false);
  });

  it("needsCompaction true when large", () => {
    const cm = new ContextManager(10, 0.5, 4);
    expect(cm.needsCompaction([{ role: "user", content: "word ".repeat(50) }])).toBe(true);
  });

  it("compacts to system + recent", () => {
    const cm = new ContextManager(5, 0.5, 2);
    const msgs = [
      { role: "system" as const, content: "sys" },
      { role: "user" as const, content: "msg1 word word" },
      { role: "assistant" as const, content: "reply1 word word" },
      { role: "user" as const, content: "recent1" },
      { role: "assistant" as const, content: "recent2" },
    ];
    const result = cm.ensureFits(msgs);
    expect(result.length).toBeLessThan(msgs.length);
  });

  it("ensureFits returns same when fits", () => {
    const cm = new ContextManager(10000, 0.8, 4);
    const msgs = [{ role: "user" as const, content: "short" }];
    expect(cm.ensureFits(msgs)).toEqual(msgs);
  });

  it("getTokenCount returns estimate", () => {
    const cm = new ContextManager(10000, 0.8, 4, "gpt-4");
    const count = cm.getTokenCount([{ role: "user", content: "hello world" }]);
    expect(count).toBeGreaterThan(0);
  });
  it("getEffectiveWindow returns window", () => {
    const cm = new ContextManager(8192, 0.8, 4);
    expect(cm.getEffectiveWindow()).toBe(8192);
  });

  it("protectToolOutput keeps tool output on compact", () => {
    const cm = new ContextManager(5, 0.5, 2);
    const msgs = [
      { role: "system" as const, content: "sys" },
      { role: "user" as const, content: "msg1 word word" },
      { role: "assistant" as const, content: "reply1 word word" },
      { role: "tool" as const, content: "protected output", tool_call_id: "tc1" },
      { role: "assistant" as const, content: "recent1" },
      { role: "user" as const, content: "recent2" },
    ];
    cm.protectToolOutput("tc1");
    const result = cm.ensureFits(msgs);
    expect(result.some((m) => m.content === "protected output")).toBe(true);
    cm.unprotectToolOutput("tc1");
  });

  it("registerBranchSummary adds summary message on compact", () => {
    const cm = new ContextManager(5, 0.5, 2);
    cm.registerBranchSummary("b1", "summary of branch", [0, 1]);
    const msgs = [
      { role: "system" as const, content: "sys" },
      { role: "user" as const, content: "msg1 word word" },
      { role: "assistant" as const, content: "reply1 word word" },
      { role: "user" as const, content: "recent1" },
      { role: "assistant" as const, content: "recent2" },
    ];
    const result = cm.ensureFits(msgs);
    expect(result.some((m) => m.content.includes("summary of branch"))).toBe(true);
  });

  it("compactWithBranches summarizes branches", () => {
    const cm = new ContextManager(5, 0.5, 2);
    const msgs = [
      { role: "user" as const, content: "one" },
      { role: "assistant" as const, content: "two" },
      { role: "user" as const, content: "recent1" },
      { role: "assistant" as const, content: "recent2" },
    ];
    const result = cm.compactWithBranches(msgs, [
      { branchId: "b1", range: [0, 1], summarize: (m) => `sum of ${m.length}` },
    ]);
    expect(result.some((m) => m.content.includes("sum of"))).toBe(true);
  });
});

describe("TokenCounter (expanded)", () => {
  it("estimate returns positive", () => {
    expect(TokenCounter.estimate("hello world")).toBeGreaterThan(0);
  });

  it("estimate empty returns 1", () => {
    expect(TokenCounter.estimate("")).toBe(1);
  });

  it("estimateMessages sums messages", () => {
    const count = TokenCounter.estimateMessages([
      { role: "user", content: "hello" },
      { role: "assistant", content: "world" },
    ]);
    expect(count).toBeGreaterThan(0);
  });

  it("getModelContextWindow returns default for unknown", () => {
    expect(TokenCounter.getModelContextWindow("unknown-model")).toBe(32768);
  });
});