import { describe, it, expect } from "vitest";
import { TokenCounter, ContextManager } from "../src/context.js";
import type { ChatMessage } from "../src/types.js";

describe("TokenCounter", () => {
  it("estimates non-empty text", () => {
    expect(TokenCounter.estimate("hello world foo bar")).toBeGreaterThan(0);
  });

  it("estimates empty as 1", () => {
    expect(TokenCounter.estimate("")).toBe(1);
  });

  it("estimates messages", () => {
    const msgs: ChatMessage[] = [
      { role: "user", content: "hello world" },
      { role: "assistant", content: "hi there" },
    ];
    expect(TokenCounter.estimateMessages(msgs)).toBeGreaterThan(0);
  });
});

describe("ContextManager", () => {
  it("needs compaction false when small", () => {
    const cm = new ContextManager(10000, 0.8, 4);
    expect(cm.needsCompaction([{ role: "user", content: "short" }])).toBe(false);
  });

  it("needs compaction true when large", () => {
    const cm = new ContextManager(10, 0.5, 4);
    const msgs: ChatMessage[] = [{ role: "user", content: "word ".repeat(50) }];
    expect(cm.needsCompaction(msgs)).toBe(true);
  });

  it("compacts to system + recent", () => {
    const cm = new ContextManager(5, 0.5, 2);
    const msgs: ChatMessage[] = [
      { role: "system", content: "sys" },
      { role: "user", content: "msg1 word word word" },
      { role: "assistant", content: "reply1 word word word" },
      { role: "user", content: "msg2 word word word" },
      { role: "assistant", content: "reply2 word word word" },
      { role: "user", content: "recent1" },
      { role: "assistant", content: "recent2" },
    ];
    const result = cm.ensureFits(msgs);
    expect(result.length).toBeLessThan(msgs.length);
  });

  it("no compaction when fits", () => {
    const cm = new ContextManager(10000, 0.8, 4);
    const msgs: ChatMessage[] = [{ role: "user", content: "short" }];
    expect(cm.ensureFits(msgs)).toEqual(msgs);
  });
});
