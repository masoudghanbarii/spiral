export type AgentMode = "normal" | "plan" | "bypass" | "safe" | "interactive";

export type { MCPServerConfig } from "./managers/mcp.js";

export type TraceEventType =
  | "agent_step"
  | "tool_call"
  | "tool_result"
  | "verification"
  | "verification_retry"
  | "event_trigger"
  | "event_complete"
  | "engine_analysis"
  | "harness_improvement"
  | "error";

export type VerificationStatus = "pass" | "fail" | "error";

export type LLMProvider =
  | "ollama"
  | "anthropic"
  | "openai"
  | "gemini"
  | "xai"
  | "mistral"
  | "groq"
  | "openrouter"
  | "deepseek"
  | "together";

export type PermissionLevel = "auto" | "approve" | "deny";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

export interface LLMResponse {
  message: {
    content: string;
    tool_calls?: ToolCall[];
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

export interface SessionInfo {
  sessionId: string;
  mode: string;
  started: string;
  completed: number;
  failed: number;
  total: number;
  sizeBytes: number;
}
