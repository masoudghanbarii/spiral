import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

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
  permissions?: Record<string, string>;
  profile?: string;
 configFile?: string;
};

// Provider name constants
export const PROVIDER_NAMES = {
  ollama: "ollama",
  anthropic: "anthropic",
  openai: "openai",
  gemini: "gemini",
  xai: "xai",
  mistral: "mistral",
  groq: "groq",
  openrouter: "openrouter",
  deepseek: "deepseek",
  together: "together",
} as const;

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
  permissions?: Record<string, string>;
  profile?: string;
  configFile?: string;

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
    this.permissions = init.permissions;
    this.profile = init.profile ?? process.env.SPIRAL_PROFILE;
    this.configFile = init.configFile ?? process.env.SPIRAL_CONFIG_FILE;
  }

  setProjectDir(dir: string): void {
    this.projectDir = dir;
    this.adrPath = path.join(dir, "docs", "adr", "001-architecture.md");
    this.agentsPath = path.join(dir, "AGENTS.md");
  }

  /**
   * Load a JSON config file and merge with current config values.
   * Env vars take precedence over file values; file fills in gaps.
   */
  async loadConfigFile(filePath: string): Promise<void> {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(await readFile(filePath, "utf-8"));
    } catch {
      throw new Error("Cannot read config file: " + filePath);
    }

    // Only apply values that aren't already set by env vars or init
    if (!process.env.SPIRAL_OLLAMA_BASE_URL && data.ollamaBaseUrl)
      this.ollamaBaseUrl = data.ollamaBaseUrl as string;
    if (!process.env.SPIRAL_MODEL && data.model) this.model = data.model as string;
    if (!process.env.SPIRAL_PROJECT_DIR && data.projectDir)
      this.setProjectDir(data.projectDir as string);
    if (data.maxAgentIterations && !process.env.SPIRAL_MAX_AGENT_ITERATIONS)
      this.maxAgentIterations = data.maxAgentIterations as number;
    if (data.maxVerificationRetries && !process.env.SPIRAL_MAX_VERIFICATION_RETRIES)
      this.maxVerificationRetries = data.maxVerificationRetries as number;
    if (data.autoApprove !== undefined && !process.env.SPIRAL_AUTO_APPROVE)
      this.autoApprove = data.autoApprove as boolean;
    if (data.contextWindowTokens && !process.env.SPIRAL_CONTEXT_WINDOW_TOKENS)
      this.contextWindowTokens = data.contextWindowTokens as number;
    if (data.compactionThreshold && !process.env.SPIRAL_COMPACTION_THRESHOLD)
      this.compactionThreshold = data.compactionThreshold as number;
    if (data.compactionKeepRecent && !process.env.SPIRAL_COMPACTION_KEEP_RECENT)
      this.compactionKeepRecent = data.compactionKeepRecent as number;
    if (data.streamEnabled !== undefined && !process.env.SPIRAL_STREAM)
      this.streamEnabled = data.streamEnabled as boolean;
    if (data.llmProvider && !process.env.SPIRAL_LLM_PROVIDER)
      this.llmProvider = data.llmProvider as string;
    if (data.agentMode && !process.env.SPIRAL_AGENT_MODE)
      this.agentMode = data.agentMode as string;
    if (data.permissions) this.permissions = data.permissions as Record<string, string>;
    if (data.profile) this.profile = data.profile as string;
  }

  /**
   * Validate config for common misconfigurations.
   * Returns an array of error messages. Empty array means valid.
   */
  validate(): string[] {
    const errors: string[] = [];

    // Check model/provider consistency
    if (this.llmProvider === "anthropic" && !this.ollamaApiKey) {
      errors.push("Anthropic provider requires an API key (SPIRAL_OLLAMA_API_KEY)");
    }
    if (this.llmProvider === "openai" && !this.ollamaApiKey) {
      errors.push("OpenAI provider requires an API key (SPIRAL_OLLAMA_API_KEY)");
    }

    // Check context window makes sense
    if (this.contextWindowTokens < 1024) {
      errors.push("contextWindowTokens (" + this.contextWindowTokens + ") is very small (< 1024)");
    }
    if (this.compactionThreshold < 0.1 || this.compactionThreshold > 1.0) {
      errors.push(
        "compactionThreshold (" + this.compactionThreshold + ") should be between 0.1 and 1.0",
      );
    }
    if (this.compactionKeepRecent < 1) {
      errors.push("compactionKeepRecent (" + this.compactionKeepRecent + ") must be >= 1");
    }

    // Check permission rules for invalid values
    if (this.permissions) {
      const validLevels = new Set(["allow", "ask", "deny"]);
      for (const [tool, level] of Object.entries(this.permissions)) {
        if (!validLevels.has(level)) {
          errors.push(
            'Invalid permission level "' + level + '" for tool "' + tool + '" (expected: allow, ask, deny)',
          );
        }
      }
    }

    // Check agent mode
    const validModes = new Set(["normal", "plan", "bypass", "safe", "interactive"]);
    if (!validModes.has(this.agentMode)) {
      errors.push(
        'Invalid agentMode "' + this.agentMode + '" (expected: ' + [...validModes].join(", ") + ")",
      );
    }

    // Check max iterations is reasonable
    if (this.maxAgentIterations < 1) {
      errors.push("maxAgentIterations (" + this.maxAgentIterations + ") must be >= 1");
    }

    // Check for conflicting config
    if (this.autoApprove && this.permissions) {
      const hasAsk = Object.values(this.permissions).includes("ask");
      if (hasAsk) {
        errors.push("autoApprove is true but permissions have 'ask' rules — these will be ignored");
      }
    }

    return errors;
  }
}