import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type ConfigInit = {
  ollamaBaseUrl?: string;
  ollamaApiKey?: string;
  model?: string;
  projectDir?: string;
  spiralDir?: string;
  maxAgentIterations?: number;
  maxVerificationRetries?: number;
  engineAnalysisInterval?: number;
  verificationTimeoutS?: number;
  watchPollIntervalS?: number;
  autoApprove?: boolean;
  contextWindowTokens?: number;
  compactionThreshold?: number;
  compactionKeepRecent?: number;
  streamEnabled?: boolean;
  llmProvider?: string;
  agentMode?: string;
};

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (!v) return fallback;
  return ["1", "true", "yes"].includes(v.toLowerCase());
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  return v ? parseInt(v, 10) : fallback;
}

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  return v ? parseFloat(v) : fallback;
}

export class Config {
  ollamaBaseUrl: string;
  ollamaApiKey: string;
  model: string;
  projectDir: string;
  spiralDir: string;
  adrPath: string;
  agentsPath: string;
  tracesDir: string;
  stateFile: string;
  skillsDir: string;
  statusFile: string;
  memoryDir: string;
  maxAgentIterations: number;
  maxVerificationRetries: number;
  engineAnalysisInterval: number;
  verificationTimeoutS: number;
  watchPollIntervalS: number;
  autoApprove: boolean;
  contextWindowTokens: number;
  compactionThreshold: number;
  compactionKeepRecent: number;
  streamEnabled: boolean;
  llmProvider: string;
  agentMode: string;

  constructor(init: ConfigInit = {}) {
    this.ollamaBaseUrl =
      init.ollamaBaseUrl ?? process.env.SPIRAL_OLLAMA_BASE_URL ?? "http://localhost:11434";
    this.ollamaApiKey = init.ollamaApiKey ?? process.env.SPIRAL_OLLAMA_API_KEY ?? "";
    this.model = init.model ?? process.env.SPIRAL_MODEL ?? "deepseek-v4-flash:cloud";
    this.projectDir = init.projectDir ?? process.env.SPIRAL_PROJECT_DIR ?? process.cwd();
    this.spiralDir = init.spiralDir ?? path.resolve(__dirname, "..");
    this.adrPath = path.join(this.projectDir, "docs", "adr", "001-architecture.md");
    this.agentsPath = path.join(this.projectDir, "AGENTS.md");
    this.tracesDir = path.join(this.spiralDir, "traces");
    this.stateFile = path.join(this.spiralDir, "state.json");
    this.skillsDir = path.join(this.spiralDir, "skills");
    this.statusFile = path.join(this.spiralDir, "status.json");
    this.memoryDir = path.join(this.spiralDir, "memory");
    this.maxAgentIterations = init.maxAgentIterations ?? envInt("SPIRAL_MAX_AGENT_ITERATIONS", 50);
    this.maxVerificationRetries =
      init.maxVerificationRetries ?? envInt("SPIRAL_MAX_VERIFICATION_RETRIES", 3);
    this.engineAnalysisInterval =
      init.engineAnalysisInterval ?? envInt("SPIRAL_ENGINE_ANALYSIS_INTERVAL", 5);
    this.verificationTimeoutS =
      init.verificationTimeoutS ?? envInt("SPIRAL_VERIFICATION_TIMEOUT_S", 300);
    this.watchPollIntervalS =
      init.watchPollIntervalS ?? envFloat("SPIRAL_WATCH_POLL_INTERVAL_S", 1.5);
    this.autoApprove = init.autoApprove ?? envBool("SPIRAL_AUTO_APPROVE", false);
    this.contextWindowTokens =
      init.contextWindowTokens ?? envInt("SPIRAL_CONTEXT_WINDOW_TOKENS", 32768);
    this.compactionThreshold =
      init.compactionThreshold ?? envFloat("SPIRAL_COMPACTION_THRESHOLD", 0.8);
    this.compactionKeepRecent =
      init.compactionKeepRecent ?? envInt("SPIRAL_COMPACTION_KEEP_RECENT", 4);
    this.streamEnabled = init.streamEnabled ?? envBool("SPIRAL_STREAM", false);
    this.llmProvider = init.llmProvider ?? process.env.SPIRAL_LLM_PROVIDER ?? "ollama";
    this.agentMode = init.agentMode ?? process.env.SPIRAL_AGENT_MODE ?? "normal";
  }

  setProjectDir(dir: string): void {
    this.projectDir = dir;
    this.adrPath = path.join(dir, "docs", "adr", "001-architecture.md");
    this.agentsPath = path.join(dir, "AGENTS.md");
  }
}
