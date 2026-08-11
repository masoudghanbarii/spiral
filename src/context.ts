import type { ChatMessage } from "./types.js";

/** Known model context window sizes (in tokens). */
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "deepseek-v4-flash:cloud": 32768,
  "deepseek-v4-flash": 32768,
  "deepseek-r1:cloud": 65536,
  "deepseek-r1": 65536,
  "llama3.3:70b": 32768,
  "llama3.3:8b": 32768,
  "qwen2.5:72b": 32768,
  "qwen2.5:7b": 32768,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "claude-sonnet-4-20250514": 200000,
  "claude-3-5-sonnet-20241022": 200000,
  "claude-3-haiku-20240307": 200000,
};

/** Default context window if model is unknown. */
const DEFAULT_CONTEXT_WINDOW = 32768;

export class TokenCounter {
  static estimate(text: string): number {
    return Math.max(1, Math.round(text.split(/\s+/).length * 1.3));
  }

  static estimateMessages(messages: ChatMessage[]): number {
    return messages.reduce((sum, m) => sum + TokenCounter.estimate(m.content ?? ""), 0);
  }

  /**
   * Get the context window size for a given model.
   * Falls back to DEFAULT_CONTEXT_WINDOW if unknown.
   */
  static getModelContextWindow(model: string): number {
    // Try exact match first
    if (MODEL_CONTEXT_WINDOWS[model]) return MODEL_CONTEXT_WINDOWS[model];
    // Try case-insensitive match
    const lower = model.toLowerCase();
    for (const [key, val] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
      if (key.toLowerCase() === lower) return val;
    }
    // Try prefix match (e.g., "gpt-4o-2024-08-06" matches "gpt-4o")
    for (const [key, val] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
      if (model.startsWith(key) || lower.startsWith(key.toLowerCase())) return val;
    }
    return DEFAULT_CONTEXT_WINDOW;
  }
}

interface BranchSummary {
  branchId: string;
  summary: string;
  messageRange: [number, number];
}

export class ContextManager {
  private window: number;
  private threshold: number;
  keepRecent: number;
  private model: string;
  private protectedToolOutputs: Set<string>;
  private branchSummaries: Map<string, BranchSummary>;

  /** Get the current model name. */
  getModel(): string {
    return this.model;
  }

  constructor(window: number, threshold: number, keepRecent: number, model?: string) {
    this.window = model ? TokenCounter.getModelContextWindow(model) : window;
    this.threshold = threshold;
    this.keepRecent = keepRecent;
    this.model = model ?? "";
    this.protectedToolOutputs = new Set();
    this.branchSummaries = new Map();
  }

  /**
   * Update the model and recalculate the context window.
   */
  setModel(model: string): void {
    this.model = model;
    this.window = TokenCounter.getModelContextWindow(model);
  }

  /**
   * Mark a tool output as protected from pruning.
   */
  protectToolOutput(toolCallId: string): void {
    this.protectedToolOutputs.add(toolCallId);
  }

  /**
   * Remove protection from a tool output.
   */
  unprotectToolOutput(toolCallId: string): void {
    this.protectedToolOutputs.delete(toolCallId);
  }

  /**
   * Register a summary for a branch of conversation.
   */
  registerBranchSummary(
    branchId: string,
    summary: string,
    messageRange: [number, number],
  ): void {
    this.branchSummaries.set(branchId, { branchId, summary, messageRange });
  }

  getTokenCount(messages: ChatMessage[]): number {
    return TokenCounter.estimateMessages(messages);
  }

  needsCompaction(messages: ChatMessage[]): boolean {
    return this.getTokenCount(messages) > this.window * this.threshold;
  }

  ensureFits(messages: ChatMessage[]): ChatMessage[] {
    if (this.needsCompaction(messages)) {
      return this.compact(messages);
    }
    return messages;
  }

  /**
   * Compact messages, keeping system messages, protected tool outputs,
   * recent messages, and branch summaries.
   */
  compact(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length <= this.keepRecent + 1) return messages;

    const system: ChatMessage[] = [];
    if (messages[0]?.role === "system") {
      system.push(messages[0]);
    }

    // Collect protected tool outputs from the middle section
    const protectedMsgs: ChatMessage[] = [];
    const midEnd = messages.length - this.keepRecent;
    for (let i = system.length; i < midEnd; i++) {
      const msg = messages[i];
      if (!msg) continue;
      if (msg.role === "tool" && msg.tool_call_id && this.protectedToolOutputs.has(msg.tool_call_id)) {
        protectedMsgs.push(msg);
      }
    }

    // Build branch summary messages if any exist
    const branchSummaryMsgs: ChatMessage[] = [];
    if (this.branchSummaries.size > 0) {
      const summaries = [...this.branchSummaries.values()];
      const summaryText = summaries
        .map((s) => `[Branch: ${s.branchId}] ${s.summary}`)
        .join("\n\n");
      branchSummaryMsgs.push({
        role: "system",
        content: `Branch summaries:\n${summaryText}`,
      });
    }

    // Keep recent messages
    const recent = messages.slice(-this.keepRecent);

    return [...system, ...branchSummaryMsgs, ...protectedMsgs, ...recent];
  }

  /**
   * Compact with per-branch summarization.
   * Each branch is summarized separately before compaction.
   */
  compactWithBranches(
    messages: ChatMessage[],
    branches: Array<{
      branchId: string;
      range: [number, number];
      summarize: (msgs: ChatMessage[]) => string;
    }>,
  ): ChatMessage[] {
    // Summarize each branch
    for (const branch of branches) {
      const [start, end] = branch.range;
      const branchMsgs = messages.slice(start, end + 1);
      const summary = branch.summarize(branchMsgs);
      this.registerBranchSummary(branch.branchId, summary, branch.range);
    }

    return this.compact(messages);
  }

  /**
   * Get the effective context window for the current model.
   */
  getEffectiveWindow(): number {
    return this.window;
  }
}