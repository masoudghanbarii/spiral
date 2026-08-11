// Root types.ts — re-exports from components/types.ts
// This keeps backward compatibility for imports from "./types.js"

export type {
  SessionStatus,
  SessionMode,
  SessionAgent,
  LogEntry,
  SessionData,
  RoleRow,
  ModeOption,
  SessionOption,
  SlashCommand,
  SessionView,
  GridCell,
  GridRow,
  StripCell,
} from "./components/types.js";

// Re-export AgentMode from the main project types
export type { AgentMode, ChatMessage } from "../types.js";

// RoleKey for role model assignment
export type RoleKey = "plan" | "build" | "judge";

// RuntimeSession extends SessionData with LLM integration state
import type { SessionData } from "./components/types.js";
import type { ChatMessage } from "../types.js";

export interface RuntimeSession extends SessionData {
  messages: ChatMessage[];
  tokenCount: number;
}
