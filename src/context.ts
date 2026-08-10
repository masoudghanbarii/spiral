import type { ChatMessage } from "./types.js";

export class TokenCounter {
  static estimate(text: string): number {
    return Math.max(1, Math.round(text.split(/\s+/).length * 1.3));
  }

  static estimateMessages(messages: ChatMessage[]): number {
    return messages.reduce((sum, m) => sum + TokenCounter.estimate(m.content ?? ""), 0);
  }
}

export class ContextManager {
  private window: number;
  private threshold: number;
  keepRecent: number;

  constructor(window: number, threshold: number, keepRecent: number) {
    this.window = window;
    this.threshold = threshold;
    this.keepRecent = keepRecent;
  }

  getTokenCount(messages: ChatMessage[]): number {
    return TokenCounter.estimateMessages(messages);
  }

  needsCompaction(messages: ChatMessage[]): boolean {
    return this.getTokenCount(messages) > this.window * this.threshold;
  }

  ensureFits(messages: ChatMessage[]): ChatMessage[] {
    if (this.needsCompaction(messages)) {
      // Simple compaction: keep system + last N
      if (messages.length <= this.keepRecent + 1) return messages;
      const system = messages[0]?.role === "system" ? [messages[0]!] : [];
      const recent = messages.slice(-this.keepRecent);
      return [...system, ...recent];
    }
    return messages;
  }
}
