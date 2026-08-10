import type { TraceEventType, VerificationStatus } from "./types.js";

export interface TraceEntryData {
  id: string;
  event_type: TraceEventType;
  timestamp: string;
  loop_name: string;
  feature: string;
  data: Record<string, unknown>;
  parent_id: string | null;
}

export class TraceEntry {
  id: string;
  eventType: TraceEventType;
  timestamp: string;
  loopName: string;
  feature: string;
  data: Record<string, unknown>;
  parentId: string | null;

  constructor(init: Partial<TraceEntryData> & Pick<TraceEntryData, "event_type">) {
    this.id = init.id ?? crypto.randomUUID().slice(0, 12);
    this.eventType = init.event_type;
    this.timestamp = init.timestamp ?? new Date().toISOString();
    this.loopName = init.loop_name ?? "";
    this.feature = init.feature ?? "";
    this.data = init.data ?? {};
    this.parentId = init.parent_id ?? null;
  }

  toDict(): TraceEntryData {
    return {
      id: this.id,
      event_type: this.eventType,
      timestamp: this.timestamp,
      loop_name: this.loopName,
      feature: this.feature,
      data: this.data,
      parent_id: this.parentId,
    };
  }

  static fromDict(d: TraceEntryData): TraceEntry {
    return new TraceEntry({
      id: d.id,
      event_type: d.event_type,
      timestamp: d.timestamp,
      loop_name: d.loop_name,
      feature: d.feature,
      data: d.data,
      parent_id: d.parent_id,
    });
  }
}

export interface GradingResultData {
  status: VerificationStatus;
  score: number;
  feedback: string;
  rubric_breakdown: Record<string, boolean>;
}

export class GradingResult {
  status: VerificationStatus;
  score: number;
  feedback: string;
  rubricBreakdown: Record<string, boolean>;

  constructor(init: Partial<GradingResultData> = {}) {
    this.status = init.status ?? "error";
    this.score = init.score ?? 0;
    this.feedback = init.feedback ?? "";
    this.rubricBreakdown = init.rubric_breakdown ?? {};
  }

  toDict(): GradingResultData {
    return {
      status: this.status,
      score: this.score,
      feedback: this.feedback,
      rubric_breakdown: this.rubricBreakdown,
    };
  }
}

export interface FeatureData {
  id: string;
  name: string;
  description: string;
  adr_section: string;
  status: string;
  implementation_attempts: number;
  last_feedback: string;
}

export class Feature {
  id: string;
  name: string;
  description: string;
  adrSection: string;
  status: string;
  implementationAttempts: number;
  lastFeedback: string;

  constructor(init: Partial<FeatureData> = {}) {
    this.id = init.id ?? crypto.randomUUID().slice(0, 8);
    this.name = init.name ?? "";
    this.description = init.description ?? "";
    this.adrSection = init.adr_section ?? "";
    this.status = init.status ?? "pending";
    this.implementationAttempts = init.implementation_attempts ?? 0;
    this.lastFeedback = init.last_feedback ?? "";
  }

  toDict(): FeatureData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      adr_section: this.adrSection,
      status: this.status,
      implementation_attempts: this.implementationAttempts,
      last_feedback: this.lastFeedback,
    };
  }

  static fromDict(d: FeatureData): Feature {
    return new Feature({
      id: d.id,
      name: d.name,
      description: d.description,
      adr_section: d.adr_section,
      status: d.status,
      implementation_attempts: d.implementation_attempts,
      last_feedback: d.last_feedback,
    });
  }
}

export interface HarnessStateData {
  features: FeatureData[];
  current_feature_index: number;
  completed_features: string[];
  failed_features: string[];
  total_agent_iterations: number;
  total_verification_runs: number;
  total_engine_analyses: number;
  harness_improvements: string[];
  system_prompt: string;
  rubrics: Record<string, unknown>;
  tool_config: Record<string, unknown>;
}

export class HarnessState {
  features: Feature[] = [];
  currentFeatureIndex = 0;
  completedFeatures: string[] = [];
  failedFeatures: string[] = [];
  totalAgentIterations = 0;
  totalVerificationRuns = 0;
  totalEngineAnalyses = 0;
  harnessImprovements: string[] = [];
  systemPrompt = "";
  rubrics: Record<string, unknown> = {};
  toolConfig: Record<string, unknown> = {};

  toDict(): HarnessStateData {
    return {
      features: this.features.map((f) => f.toDict()),
      current_feature_index: this.currentFeatureIndex,
      completed_features: this.completedFeatures,
      failed_features: this.failedFeatures,
      total_agent_iterations: this.totalAgentIterations,
      total_verification_runs: this.totalVerificationRuns,
      total_engine_analyses: this.totalEngineAnalyses,
      harness_improvements: this.harnessImprovements,
      system_prompt: this.systemPrompt,
      rubrics: this.rubrics,
      tool_config: this.toolConfig,
    };
  }

  static fromDict(d: HarnessStateData): HarnessState {
    const s = new HarnessState();
    s.features = d.features.map((f) => Feature.fromDict(f));
    s.currentFeatureIndex = d.current_feature_index;
    s.completedFeatures = d.completed_features;
    s.failedFeatures = d.failed_features;
    s.totalAgentIterations = d.total_agent_iterations;
    s.totalVerificationRuns = d.total_verification_runs;
    s.totalEngineAnalyses = d.total_engine_analyses;
    s.harnessImprovements = d.harness_improvements;
    s.systemPrompt = d.system_prompt;
    s.rubrics = d.rubrics;
    s.toolConfig = d.tool_config;
    return s;
  }
}
