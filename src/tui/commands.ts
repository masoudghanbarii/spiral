export type SlashCommandName =
  | "help"
  | "exit"
  | "quit"
  | "clear"
  | "mode"
  | "sessions"
  | "model"
  | "reset"
  | "abort"
  | "stop"
  | "new"
  | "status"
  | "usage"
  | "verbose"
  | "tools"
  | "history"
  | "agentplan"
  | "unknown";

export interface ParsedSlashCommand {
  command: SlashCommandName;
  args: string;
  raw: string;
}

const COMMAND_MAP: Record<string, SlashCommandName> = {
  "/help": "help",
  "/exit": "exit",
  "/quit": "exit",
  "/q": "exit",
  "/clear": "clear",
  "/mode": "mode",
  "/sessions": "sessions",
  "/session": "sessions",
  "/model": "model",
  "/models": "model",
  "/reset": "reset",
  "/abort": "abort",
  "/stop": "stop",
  "/new": "new",
  "/status": "status",
  "/usage": "usage",
  "/verbose": "verbose",
  "/tools": "tools",
  "/history": "history",
  "/agentplan": "agentplan",
};

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0]!.toLowerCase();
  const mapped = COMMAND_MAP[cmd];
  if (!mapped) return { command: "unknown", args: trimmed.slice(1), raw: trimmed };
  const args = trimmed.slice(cmd.length).trim();
  return { command: mapped, args, raw: trimmed };
}

export function getHelpText(): string {
  return `Spiral TUI — Slash Commands

Core:
  /help              Show this help
  /exit              Exit Spiral TUI (Ctrl+D also works)
  /agentplan         Set model per role — plan / build / judge
  /mode [mode]       Switch agent mode: normal|plan|bypass|safe|interactive
  /status            Show session + model summary
  /clear             Clear conversation history
  /model <model>     Switch LLM model
  /sessions          List all sessions
  /session <id>      Switch to a specific session
  /new               Start a fresh session
  /reset             Reset current session state
  /abort             Abort the active run (Esc also works)
  /stop              Stop the active run
  /usage             Show token usage
  /verbose <on|off>  Toggle verbose tool output
  /tools             List available tools
  /history           Show conversation history length

Keyboard:
  Enter              Send message (or approve pending tool)
  Shift+Enter        Insert newline
  Ctrl+J             Insert newline
  Tab                Switch session (overlay)
  Shift+Tab          Switch mode (overlay)
  Esc                Close overlay / abort active run
  Ctrl+C             Clear input (press twice to exit)
  Ctrl+D             Exit
  Ctrl+L             Clear screen
  Up/Down            Navigate input history / overlay / slash menu

Local shell:
  !<command>         Run a local shell command`;
}

export function getAvailableModes(): string[] {
  return ["normal", "plan", "bypass", "safe", "interactive"];
}

export function isValidMode(mode: string): boolean {
  return getAvailableModes().includes(mode);
}