// Shared types for TUI components

export type SessionStatus =
  "idle" | "running" | "waiting_approval" | "error" | "compacting" | "tool_call";

export type SessionMode = "normal" | "plan" | "bypass" | "safe" | "interactive";

export type SessionAgent = "agent" | "verifier" | "shipper" | "engine";

export interface SessionData {
  id: string;
  name: string;
  shortName: string;
  model: string;
  provider: string;
  tokensUsed: number;
  tokensMax: number;
  plugins: string[];
  mode: SessionMode;
  agent: SessionAgent;
  status: SessionStatus;
  groupId: string | null;
  pendingTool?: string;
  lastError?: string;
  roleModels: { plan: string; build: string; judge: string };
  log: LogEntry[];
}

export interface LogEntry {
  kind: "user" | "assistant" | "tool" | "system";
  text?: string;
  tool?: string;
  detail?: string;
}

export interface ModeOption {
  key: string;
  color: string;
  label: string;
  desc: string;
  rowBg: string;
  onClick: () => void;
}

export interface SessionOption {
  key: string;
  color: string;
  label: string;
  desc: string;
  rowBg: string;
  onClick: () => void;
}

export interface RoleRow {
  role: string;
  label: string;
  desc: string;
  models: RoleModelOption[];
}

export interface RoleModelOption {
  name: string;
  borderColor: string;
  bg: string;
  onClick: () => void;
}

export interface SlashCommand {
  cmd: string;
  desc: string;
  rowBg: string;
  onClick: () => void;
}

export interface SessionView {
  id: string;
  name: string;
  borderColor: string;
  groupDot: string | null;
  statusIcon: string;
  statusColor: string;
  statusLabel: string;
  modeColor: string;
  agentLabel: string;
  nameColor: string;
  rowBg: string;
  isActive: boolean;
  canLink: boolean;
  linkActive: boolean;
  linkColor: string;
  linkSpacer: string;
  onClick: () => void;
  onToggleLink: (e: any) => void;
}

// Constants from mockup

export const MODE_META: Record<SessionMode, { color: string; label: string; desc: string }> = {
  normal: {
    color: "#3ecf6a",
    label: "normal",
    desc: "Default — ask approval for destructive tools",
  },
  plan: { color: "#f2c94c", label: "plan", desc: "Read-only — outputs implementation plan" },
  bypass: { color: "#ef5350", label: "bypass", desc: "Skip all permission checks" },
  safe: { color: "#56c8d8", label: "safe", desc: "Read-only, no command execution" },
  interactive: { color: "#c678dd", label: "interactive", desc: "User can interject mid-run" },
};

export const MODE_ORDER: SessionMode[] = ["normal", "plan", "bypass", "safe", "interactive"];

export const AGENT_META: Record<SessionAgent, { color: string; label: string; desc: string }> = {
  agent: { color: "#3ecf6a", label: "agent", desc: "Agent loop — ReAct: model → tools → observe" },
  verifier: {
    color: "#56c8d8",
    label: "verifier",
    desc: "Verification loop — grade, pass/fail, retry w/ feedback",
  },
  shipper: {
    color: "#4f8cff",
    label: "shipper",
    desc: "Event loop — ADR → features → queue → ship",
  },
  engine: {
    color: "#c678dd",
    label: "engine",
    desc: "Engine analysis loop — traces → harness tweaks (meta)",
  },
};

export const AGENT_ORDER: SessionAgent[] = ["agent", "verifier", "shipper", "engine"];

export const STATUS_META: Record<SessionStatus, { icon: string; color: string; label: string }> = {
  idle: { icon: "○", color: "#3ecf6a", label: "connected" },
  running: { icon: "●", color: "#f2c94c", label: "running" },
  waiting_approval: { icon: "‼", color: "#c678dd", label: "awaiting approval" },
  error: { icon: "✕", color: "#ef5350", label: "disconnected" },
  compacting: { icon: "↻", color: "#4f8cff", label: "compacting context" },
  tool_call: { icon: "⚡", color: "#f2c94c", label: "tool running" },
};

export const STATUS_ORDER: SessionStatus[] = [
  "idle",
  "running",
  "waiting_approval",
  "error",
  "compacting",
  "tool_call",
];

export const ANIMATED_STATUSES = new Set<SessionStatus>(["running", "compacting", "tool_call"]);

export const GROUP_META: Record<string, { color: string; label: string }> = {
  A: { color: "#c678dd", label: "Group A" },
  B: { color: "#e0883b", label: "Group B" },
  C: { color: "#56c8d8", label: "Group C" },
  D: { color: "#8bc34a", label: "Group D" },
};

export const GROUP_LETTERS = ["A", "B", "C", "D"];

export const MODEL_LIST = ["Kimi-k2.6", "Claude-3.7", "GPT-5", "Deepseek-v4-flash", "GLM-5.2"];

export const ROLE_META: Record<string, { label: string; desc: string }> = {
  plan: { label: "Plan", desc: "Chooses approach, writes the ADR" },
  build: { label: "Build", desc: "Implements the plan (agent/event loop)" },
  judge: { label: "Judge", desc: "Verifies output, pass/fail + retry" },
};

export const ROLE_ORDER = ["plan", "build", "judge"];

export const SLASH_COMMANDS = [
  { cmd: "/agentplan", desc: "Set model per role — plan / build / judge" },
  { cmd: "/mode", desc: "Switch agent mode" },
  { cmd: "/model", desc: "Switch LLM model" },
  { cmd: "/new", desc: "Start a fresh session" },
  { cmd: "/newsession", desc: "Start a fresh session (alias for /new)" },
  { cmd: "/sessions", desc: "List all sessions" },
  { cmd: "/status", desc: "Print session status" },
  { cmd: "/clear", desc: "Clear this session's log" },
  { cmd: "/reset", desc: "Reset current session state" },
  { cmd: "/abort", desc: "Abort the active run" },
  { cmd: "/stop", desc: "Stop the active run" },
  { cmd: "/usage", desc: "Show token usage" },
  { cmd: "/verbose", desc: "Toggle verbose tool output" },
  { cmd: "/tools", desc: "List available tools" },
  { cmd: "/history", desc: "Show conversation history length" },
  { cmd: "/help", desc: "List all commands" },
  { cmd: "/exit", desc: "Exit Spiral TUI" },
  { cmd: "/quit", desc: "Exit Spiral TUI" },
];

export const BRAILLE = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const ACCENTS = ["#4f8cff", "#3ecf6a", "#f2c94c", "#c678dd"];

export const LOADING_WORDS = [
  "twiddling thumbs",
  "noodling",
  "ruminating",
  "percolating",
  "spelunking",
  "conjuring",
  "marinating",
  "vibing",
  "pondering",
  "loitering",
  "bikeshedding",
  "yak-shaving",
];

export function fmtTok(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "m";
  if (v >= 1_000) return Math.round(v / 1_000) + "k";
  return String(v);
}

export function buildSpiralPath(n: number): [number, number][] {
  const res: [number, number][] = [];
  let top = 0,
    bottom = n - 1,
    left = 0,
    right = n - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) res.push([top, c]);
    top++;
    for (let r = top; r <= bottom; r++) res.push([r, right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) res.push([bottom, c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) res.push([r, left]);
      left++;
    }
  }
  return res.reverse();
}

export function fadeFor(age: number): { ch: string; op: number } | null {
  if (age < 0 || age > 16) return null;
  if (age <= 1) return { ch: "●", op: 1 };
  if (age <= 3) return { ch: "◍", op: 0.82 };
  if (age <= 6) return { ch: "•", op: 0.6 };
  if (age <= 10) return { ch: "∙", op: 0.38 };
  return { ch: "·", op: 0.2 };
}

export interface GridCell {
  ch: string;
  color: string;
  op: number;
}

export interface GridRow {
  cells: GridCell[];
}

export function buildGridRows(frame: number, spiralPath: [number, number][], n: number): GridRow[] {
  const mid = (n - 1) / 2;
  const posIndex = new Map<string, number>();
  spiralPath.forEach(([r, c], i) => posIndex.set(r + "_" + c, i));
  const tailLen = 16;
  const totalCycle = spiralPath.length + tailLen;
  const k = frame % totalCycle;
  const rows: GridRow[] = [];
  for (let r = 0; r < n; r++) {
    const cells: GridCell[] = [];
    for (let c = 0; c < n; c++) {
      const i = posIndex.get(r + "_" + c);
      if (i === undefined) {
        cells.push({ ch: " ", color: ACCENTS[0], op: 0 });
      } else {
        const age = k - i;
        const f = fadeFor(age);
        const qi = (r < mid ? 0 : 2) + (c < mid ? 0 : 1);
        cells.push({
          ch: f ? f.ch : " ",
          color: ACCENTS[qi],
          op: f ? f.op : 0,
        });
      }
    }
    rows.push({ cells });
  }
  return rows;
}

export function buildCoilGrid(size: number, frame: number): GridRow[] {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const maxR = (size - 1) / 2 - 0.5;
  const turns = 3.2;
  const steps = 520;
  const grid: ({ ch: string; op: number } | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  );
  const rot = frame * 0.045;
  const ax = 1.85;
  const ay = 1;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const theta = t * turns * 2 * Math.PI + rot;
    const r = t * maxR;
    const x = cx + r * Math.cos(theta) * ax;
    const y = cy + r * Math.sin(theta) * ay;
    const ci = Math.round(x);
    const ri = Math.round(y);
    if (ci < 0 || ci >= size || ri < 0 || ri >= size) continue;
    const a = ((theta % Math.PI) + Math.PI) % Math.PI;
    let ch: string;
    if (a < Math.PI / 8 || a >= (Math.PI * 7) / 8) ch = "─";
    else if (a < (Math.PI * 3) / 8) ch = "╲";
    else if (a < (Math.PI * 5) / 8) ch = "│";
    else ch = "╱";
    grid[ri][ci] = { ch, op: Math.max(0.25, 1 - t * 0.55) };
  }
  const rows: GridRow[] = [];
  for (let r = 0; r < size; r++) {
    const cells: GridCell[] = [];
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c];
      cells.push(
        cell
          ? { ch: cell.ch, op: cell.op, color: "#c7cdd8" }
          : { ch: " ", op: 0, color: "#c7cdd8" },
      );
    }
    rows.push({ cells });
  }
  return rows;
}

export interface StripCell {
  ch: string;
  op: number;
  color: string;
}

export function buildStrip(width: number, color: string, frame: number): StripCell[] {
  const arr: StripCell[] = [];
  const tailLen = 16;
  const cyc = width + tailLen;
  const kk = frame % cyc;
  for (let i = 0; i < width; i++) {
    const age = kk - i;
    const f = fadeFor(age);
    arr.push({ ch: f ? f.ch : "·", op: f ? f.op : 0.1, color });
  }
  return arr;
}
