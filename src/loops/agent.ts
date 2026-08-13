import { Config } from "../config.js";
import { ContextManager } from "../context.js";
import { LLMClient } from "../llm.js";
import type { ManagerRegistry } from "../managers/index.js";
import { TraceEntry, Feature } from "../models.js";
import type { AgentMode, ChatMessage } from "../types.js";
import { getSystemPromptSuffix } from "../modes.js";
import { ToolRegistry } from "../tools/registry.js";
import type { InteractiveMode } from "../interactive.js";

export class AgentLoop {
  private config: Config;
  private managers: ManagerRegistry;
  private llm: LLMClient;
  private tools: ToolRegistry;
  private agentMode: AgentMode;
  private context: ContextManager;
  private interactive?: InteractiveMode;
  systemPrompt: string;

  constructor(
    config: Config,
    managers: ManagerRegistry,
    llm: LLMClient,
    tools: ToolRegistry,
    agentMode: AgentMode = "normal",
  ) {
    this.config = config;
    this.managers = managers;
    this.llm = llm;
    this.tools = tools;
    this.agentMode = agentMode;
    this.context = new ContextManager(
      config.contextWindowTokens,
      config.compactionThreshold,
      config.compactionKeepRecent,
    );
    this.systemPrompt = "";
    this.init(agentMode);
  }

  private async init(agentMode: AgentMode): Promise<void> {
    if (agentMode === "interactive") {
      const { InteractiveMode } = await import("../interactive.js");
      this.interactive = new InteractiveMode(this.managers.traces);
      this.interactive.start();
    }
    this.systemPrompt = await this.buildSystemPrompt();
  }

  private async buildSystemPrompt(): Promise<string> {
    const ctx = await this.managers.project.getProjectContext();
    const modeSuffix = getSystemPromptSuffix(this.agentMode);
    return `You are Spiral, an AI co-founder and development agent.

You assist the user with software engineering tasks — implementing features, fixing bugs, running tests, and managing the project.

You have tools to read/write files, run commands, and manage the project.
Be resourceful: read files, search the codebase, and figure things out before asking the user.
Keep responses concise. Skip fluff like "Great question!" — just help.
For casual conversation (greetings, small talk), respond naturally without calling any tools.

Project context:
${JSON.stringify(ctx, null, 2).slice(0, 2000)}${modeSuffix}`;
  }

  async run(feature: Feature, systemPrompt?: string): Promise<string> {
    await this.managers.traces.record(
      new TraceEntry({
        event_type: "agent_step",
        loop_name: "agent",
        feature: feature.name,
        data: { action: "start" },
      }),
    );

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt ?? this.systemPrompt,
      },
      {
        role: "user",
        content: `Implement feature: ${feature.name}\n\nDescription: ${feature.description}\n\nADR Section: ${feature.adrSection}\n\nPrevious feedback: ${feature.lastFeedback}`,
      },
    ];

    for (let iteration = 0; iteration < this.config.maxAgentIterations; iteration++) {
      if (this.interactive) {
        if (this.interactive.shouldStop) return "FINAL_RESULT: Stopped by user";
        while (this.interactive.isPaused) {
          await sleep(500);
          if (this.interactive.shouldStop) return "FINAL_RESULT: Stopped by user";
        }
        const msg = this.interactive.getPendingMessage();
        if (msg) messages.push(msg);
      }

      const compacted = this.context.ensureFits(messages);

      await this.managers.status.write({
        loop: "agent",
        phase: "llm_wait",
        feature: feature.name,
        iteration,
        attempt: feature.implementationAttempts + 1,
        context_tokens: this.context.getTokenCount(compacted),
      });

      const response = this.config.streamEnabled
        ? await this.llm.chatStream(compacted, this.tools.getToolDefinitions())
        : await this.llm.chat(compacted, this.tools.getToolDefinitions());

      const msg = response.message;
      if (msg.content && msg.content.includes("FINAL_RESULT")) {
        await this.managers.traces.record(
          new TraceEntry({
            event_type: "agent_step",
            loop_name: "agent",
            feature: feature.name,
            data: { action: "complete", iterations: iteration },
          }),
        );
        await this.managers.status.write({
          loop: "agent",
          phase: "complete",
          feature: feature.name,
          iterations: iteration,
        });
        return msg.content;
      }

      const toolCalls = msg.tool_calls ?? [];
      if (toolCalls.length === 0) {
        messages.push({ role: "assistant", content: msg.content ?? "" });
        continue;
      }

      for (const tc of toolCalls) {
        const funcName = tc.function.name;
        let funcArgs: Record<string, unknown> = {};
        try {
          // Ollama returns arguments as an object, OpenAI returns a JSON string
          const raw = tc.function.arguments;
          if (typeof raw === "string") {
            funcArgs = JSON.parse(raw) as Record<string, unknown>;
          } else if (typeof raw === "object") {
            funcArgs = raw as Record<string, unknown>;
          }
        } catch {
          funcArgs = {};
        }

        await this.managers.traces.record(
          new TraceEntry({
            event_type: "tool_call",
            loop_name: "agent",
            feature: feature.name,
            data: { tool: funcName, args: funcArgs },
          }),
        );

        await this.managers.status.write({
          loop: "agent",
          phase: "tool_executing",
          feature: feature.name,
          tool: funcName,
          iteration,
        });

        const result = await this.tools.execute(funcName, funcArgs);

        await this.managers.traces.record(
          new TraceEntry({
            event_type: "tool_result",
            loop_name: "agent",
            feature: feature.name,
            data: { tool: funcName, result: result.slice(0, 500) },
          }),
        );

        messages.push({ role: "assistant", content: msg.content ?? "" });
        messages.push({
          role: "tool",
          content: result.slice(0, 2000),
          tool_call_id: tc.id,
        });
      }
    }

    await this.managers.traces.record(
      new TraceEntry({
        event_type: "error",
        loop_name: "agent",
        feature: feature.name,
        data: { error: "max_iterations" },
      }),
    );
    return "FINAL_RESULT: Max iterations reached without completion.";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
