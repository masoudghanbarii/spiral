// Session bridge — allows tools to interact with other TUI sessions

export interface SessionInfo {
  id: string;
  name: string;
}

export interface SessionBridge {
  /** List all active sessions */
  listSessions(): SessionInfo[];
  /** Push a log entry into another session */
  pushLogEntry(targetId: string, entry: { kind: "user" | "assistant" | "tool" | "system"; text: string }): boolean;
  /** Link two sessions into a shared context group */
  linkSessions(sessionA: string, sessionB: string): boolean;
  /** Get the current session ID */
  getCurrentSessionId(): string;
}