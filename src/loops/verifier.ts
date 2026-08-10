import { Config } from "../config.js";
import { LLMClient } from "../llm.js";
import type { ManagerRegistry } from "../managers/index.js";
import { Feature, GradingResult, TraceEntry } from "../models.js";
import type { VerificationStatus } from "../types.js";
import { ToolRegistry } from "../tools/registry.js";

export class VerificationLoop {
  private config: Config;
  private managers: ManagerRegistry;
  private llm: LLMClient;
  private tools: ToolRegistry;

  constructor(config: Config, managers: ManagerRegistry, llm: LLMClient, tools: ToolRegistry) {
    this.config = config;
    this.managers = managers;
    this.llm = llm;
    this.tools = tools;
  }

  async grade(feature: Feature, agentOutput: string): Promise<GradingResult> {
    await this.managers.traces.record(
      new TraceEntry({
        event_type: "verification",
        loop_name: "verifier",
        feature: feature.name,
        data: { action: "start" },
      }),
    );

    const rubric = this.buildRubric(feature);
    const prompt = `Grade the implementation of feature '${feature.name}' against this rubric:

RUBRIC:
${rubric}

FEATURE DESCRIPTION:
${feature.description}

ADR SECTION:
${feature.adrSection}

AGENT OUTPUT:
${agentOutput.slice(0, 3000)}

Return JSON:
{"status": "pass"|"fail", "score": 0.0-1.0, "feedback": "detailed feedback", "rubric_breakdown": {"criterion_name": true|false}}`;

    const response = await this.llm.generate(
      prompt,
      "You are a strict code reviewer. Grade implementations against the rubric.",
    );
    const result = (this.llm.extractJson(response) as {
      status?: string;
      score?: number;
      feedback?: string;
      rubric_breakdown?: Record<string, boolean>;
    }) ?? {
      status: "error",
      score: 0,
      feedback: "Could not parse grading response",
    };

    const grade = new GradingResult({
      status: (result.status as VerificationStatus) ?? "error",
      score: result.score ?? 0,
      feedback: result.feedback ?? "",
      rubric_breakdown: result.rubric_breakdown ?? {},
    });

    await this.managers.traces.record(
      new TraceEntry({
        event_type: "verification",
        loop_name: "verifier",
        feature: feature.name,
        data: {
          status: grade.status,
          score: grade.score,
          feedback: grade.feedback.slice(0, 200),
        },
      }),
    );

    return grade;
  }

  private buildRubric(feature: Feature): string {
    return `1. Implementation matches ADR specification for section '${feature.adrSection}'
2. Code follows project conventions (type hints, async, proper types)
3. Unit tests exist with adequate coverage
4. No breaking changes to existing interfaces
5. Error handling is appropriate
6. Security: no hardcoded secrets, proper input validation`;
  }

  async run(feature: Feature, agentOutput: string): Promise<[boolean, GradingResult]> {
    let grade: GradingResult = new GradingResult();
    for (let attempt = 0; attempt < this.config.maxVerificationRetries; attempt++) {
      grade = await this.grade(feature, agentOutput);
      if (grade.status === "pass") return [true, grade];

      feature.lastFeedback = grade.feedback;
      feature.implementationAttempts++;

      await this.managers.traces.record(
        new TraceEntry({
          event_type: "verification_retry",
          loop_name: "verifier",
          feature: feature.name,
          data: { attempt: attempt + 1, feedback: grade.feedback.slice(0, 200) },
        }),
      );

      if (attempt < this.config.maxVerificationRetries - 1) {
        const { AgentLoop } = await import("./agent.js");
        const agent = new AgentLoop(this.config, this.managers, this.llm, this.tools);
        agentOutput = await agent.run(feature);
      }
    }
    return [false, grade];
  }
}
