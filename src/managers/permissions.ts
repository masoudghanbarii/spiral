import { Config } from "../config.js";
import type { PermissionLevel } from "../types.js";
import { TraceEntry } from "../models.js";
import type { TraceManager } from "./traces.js";

const DESTRUCTIVE_TOOLS = new Set([
  "write_file",
  "edit_file",
  "run_command",
  "mark_adr_done",
  "git_commit",
  "git_add",
  "git_branch",
]);

const AUTO_DENY_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /git\s+push\s+--force/i,
  /git\s+push\s+-f\b/i,
  /\bsudo\b/i,
  /chmod\s+777/i,
  /\bdd\s+of=/i,
  /\bmkfs\b/i,
  /shutdown\b/i,
  /reboot\b/i,
];

const PROTECTED_PATHS = [/\.env\b/i, /\/etc\//, /~\/\.ssh\//];
void PROTECTED_PATHS;

export class PermissionManager {
  autoApprove: boolean;
  private traces?: TraceManager;

  constructor(config: Config, traces?: TraceManager) {
    this.autoApprove = config.autoApprove;
    this.traces = traces;
  }

  check(toolName: string, args: Record<string, unknown>): PermissionLevel {
    if (this.isDenyPattern(toolName, args)) return "deny";
    if (this.autoApprove || !DESTRUCTIVE_TOOLS.has(toolName)) return "auto";
    return "approve";
  }

  private isDenyPattern(toolName: string, args: Record<string, unknown>): boolean {
    if (toolName !== "run_command") return false;
    const command = String(args.command ?? "");
    return AUTO_DENY_PATTERNS.some((p) => p.test(command));
  }

  // @ts-expect-error kept for future use
  private _isProtectedPath(_toolName: string, _args: Record<string, unknown>): boolean {
    void PROTECTED_PATHS;
    return false;
  }

  async shouldExecute(toolName: string, args: Record<string, unknown>): Promise<[boolean, string]> {
    const level = this.check(toolName, args);
    if (level === "deny") {
      await this.traces?.record(
        new TraceEntry({
          event_type: "error",
          loop_name: "permission",
          feature: "*",
          data: { tool: toolName, decision: "deny", args },
        }),
      );
      return [false, "Denied: command matched auto-deny pattern"];
    }
    if (level === "approve" && !this.autoApprove) {
      const reason = `Approval required for ${toolName}`;
      await this.traces?.record(
        new TraceEntry({
          event_type: "agent_step",
          loop_name: "permission",
          feature: "*",
          data: { tool: toolName, decision: "approve_required", args },
        }),
      );
      return [false, reason];
    }
    return [true, "ok"];
  }
}
