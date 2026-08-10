import { Config } from "../config.js";
import { LLMClient } from "../llm.js";
import type { ManagerRegistry } from "../managers/index.js";
import { HarnessState, TraceEntry } from "../models.js";

export class EngineAnalysisLoop {
  private config: Config;
  private managers: ManagerRegistry;
  private llm: LLMClient;
  analysisCount = 0;

  constructor(config: Config, managers: ManagerRegistry, llm: LLMClient) {
    this.config = config;
    this.managers = managers;
    this.llm = llm;
  }

  async analyze(state: HarnessState): Promise<string[]> {
    this.analysisCount++;
    await this.managers.traces.record(
      new TraceEntry({
        event_type: "engine_analysis",
        loop_name: "engine",
        feature: "*",
        data: { count: this.analysisCount },
      }),
    );

    const tracesFeed = this.managers.traces.getEngineFeed();
    const prompt = `You are the meta-analysis engine for Spiral AI co-founder.

Review execution traces and suggest harness improvements.

Current state:
- Completed features: ${state.completedFeatures.join(", ")}
- Failed features: ${state.failedFeatures.join(", ")}
- Total iterations: ${state.totalAgentIterations}
- Total verifications: ${state.totalVerificationRuns}

Recent traces:
${tracesFeed.slice(0, 4000)}

Analyze patterns:
1. Are there recurring failures? Suggest prompt or rubric changes.
2. Are tools being used effectively? Suggest tool config changes.
3. Is the agent missing context? Suggest system prompt improvements.
4. Are verification criteria too strict or too loose? Suggest rubric changes.

Return JSON:
{"improvements": ["improvement1", ...], "prompt_changes": "...", "rubric_changes": {}, "tool_changes": {}}`;

    const response = await this.llm.generate(
      prompt,
      "You analyze agent execution traces and suggest harness improvements.",
    );
    const result = (this.llm.extractJson(response) as {
      improvements?: string[];
      prompt_changes?: string;
      rubric_changes?: Record<string, unknown>;
      tool_changes?: Record<string, unknown>;
    }) ?? {
      improvements: [],
      prompt_changes: "",
      rubric_changes: {},
      tool_changes: {},
    };

    const improvements = result.improvements ?? [];

    if (result.prompt_changes) {
      state.systemPrompt = result.prompt_changes;
      improvements.push(`System prompt updated: ${result.prompt_changes.slice(0, 100)}`);
    }
    if (result.rubric_changes) {
      Object.assign(state.rubrics, result.rubric_changes);
      improvements.push(`Rubrics updated: ${JSON.stringify(result.rubric_changes).slice(0, 100)}`);
    }
    if (result.tool_changes) {
      Object.assign(state.toolConfig, result.tool_changes);
      improvements.push(
        `Tool config updated: ${JSON.stringify(result.tool_changes).slice(0, 100)}`,
      );
    }

    state.harnessImprovements.push(...improvements);
    state.totalEngineAnalyses++;

    for (const imp of improvements) {
      await this.managers.traces.record(
        new TraceEntry({
          event_type: "harness_improvement",
          loop_name: "engine",
          feature: "*",
          data: { improvement: imp },
        }),
      );
    }

    await this.managers.state.save(state);
    return improvements;
  }

  shouldAnalyze(state: HarnessState): boolean {
    return (
      this.analysisCount === 0 ||
      state.completedFeatures.length % this.config.engineAnalysisInterval === 0 ||
      state.failedFeatures.length > this.analysisCount * 2
    );
  }
}
