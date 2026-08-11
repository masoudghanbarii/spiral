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

type PermissionHook = (tool: string, args: Record<string, unknown>) => void;

export type PermissionRuleLevel = "allow" | "ask" | "deny";

interface PathPattern {
  tool: string;
  pattern: string;
  level: PermissionRuleLevel;
}

/**
 * Convert a glob-like pattern to a RegExp.
 * Supports *, **, and ? wildcards.
 */
function globToRegExp(pattern: string): RegExp {
  // Escape regex special chars except * and ?
  let result = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  // ** matches any number of path segments — use a null placeholder to avoid double-replacement
  result = result.replace(/\*\*/g, "\u0000DBLSTAR\u0000");
  // * matches anything except /
  result = result.replace(/\*/g, "[^/]*");
  // Restore ** -> .*
  result = result.replace(/\u0000DBLSTAR\u0000/g, ".*");
  // ? matches single char
  result = result.replace(/\?/g, ".");
  return new RegExp("^" + result + "$", "i");
}

export class PermissionManager {
  autoApprove: boolean;
  private traces?: TraceManager;
  private rules: Record<string, PermissionRuleLevel> = {};
  private pathPatterns: PathPattern[] = [];
  private approved: Set<string> = new Set();
  private beforeHooks: PermissionHook[] = [];
  private afterHooks: PermissionHook[] = [];

  constructor(config: Config, traces?: TraceManager) {
    this.autoApprove = config.autoApprove;
    this.traces = traces;
    // Load per-tool rules from config if present
    if (config.permissions) {
      this.setRules(config.permissions);
    }
  }

  /**
   * Set per-tool permission rules.
   * Example: { "write_file": "ask", "run_command": "ask", "read_file": "allow" }
   */
  setRules(rules: Record<string, string>): void {
    for (const [tool, level] of Object.entries(rules)) {
      if (level === "allow" || level === "ask" || level === "deny") {
        this.rules[tool] = level;
      }
    }
  }

  /**
   * Add a path pattern rule for a specific tool.
   * Example: addPathPattern with glob patterns like src / ** / *.ts
   */
  addPathPattern(tool: string, pattern: string, level: PermissionRuleLevel): void {
    this.pathPatterns.push({ tool, pattern, level });
  }

  /**
   * Add an approved command pattern to the session allowlist.
   * Once approved, matching commands won't ask again.
   */
  addApproved(pattern: string): void {
    this.approved.add(pattern);
  }

  /**
   * Register a pre- or post-permission hook.
   * Hooks run before/after permission checks but cannot block execution.
   */
  addHook(event: "before" | "after", fn: PermissionHook): void {
    if (event === "before") {
      this.beforeHooks.push(fn);
    } else {
      this.afterHooks.push(fn);
    }
  }

  /**
   * Derive permissions for a subagent from the parent's permissions.
   * Subagents are more restrictive: "allow" becomes "ask", "ask" stays "ask", "deny" stays "deny".
   */
  deriveSubagentPermissions(): PermissionManager {
    const sub = new PermissionManager(
      new Config({ autoApprove: false }),
      this.traces,
    );
    // Copy rules but make them more restrictive
    for (const [tool, level] of Object.entries(this.rules)) {
      sub.rules[tool] = level === "allow" ? "ask" : level;
    }
    // Copy path patterns but make them more restrictive
    for (const p of this.pathPatterns) {
      sub.pathPatterns.push({
        tool: p.tool,
        pattern: p.pattern,
        level: p.level === "allow" ? "ask" : p.level,
      });
    }
    // Don't share the approved list with subagents (more restrictive)
    // Don't share hooks (subagents have their own lifecycle)
    return sub;
  }

  private runBeforeHooks(tool: string, args: Record<string, unknown>): void {
    for (const hook of this.beforeHooks) {
      try {
        hook(tool, args);
      } catch {
        // hooks should not block execution
      }
    }
  }

  private runAfterHooks(tool: string, args: Record<string, unknown>): void {
    for (const hook of this.afterHooks) {
      try {
        hook(tool, args);
      } catch {
        // hooks should not block execution
      }
    }
  }

  private matchPathPatterns(
    toolName: string,
    args: Record<string, unknown>,
  ): PermissionRuleLevel | null {
    // Extract path from common arg names
    const pathValue =
      (args.path as string) ??
      (args.file as string) ??
      (args.filePath as string) ??
      (args.filename as string) ??
      "";
    if (!pathValue) return null;

    for (const p of this.pathPatterns) {
      if (p.tool !== toolName && p.tool !== "*") continue;
      const re = globToRegExp(p.pattern);
      if (re.test(pathValue)) return p.level;
    }
    return null;
  }

  private isApproved(toolName: string, args: Record<string, unknown>): boolean {
    if (toolName === "run_command") {
      const cmd = String(args.command ?? "");
      for (const approved of this.approved) {
        try {
          if (new RegExp(approved).test(cmd)) return true;
        } catch {
          if (cmd === approved) return true;
        }
      }
    }
    // Also check file paths against approved patterns
    const pathValue =
      (args.path as string) ??
      (args.file as string) ??
      (args.filePath as string) ??
      "";
    if (pathValue) {
      for (const approved of this.approved) {
        try {
          if (new RegExp(approved).test(pathValue)) return true;
        } catch {
          if (pathValue === approved) return true;
        }
      }
    }
    return false;
  }

  check(toolName: string, args: Record<string, unknown>): PermissionLevel {
    // 1. Check auto-deny patterns first (highest priority)
    if (this.isDenyPattern(toolName, args)) return "deny";

    // 2. Check per-tool rules for explicit deny
    const rule = this.rules[toolName];
    if (rule === "deny") return "deny";

    // 3. Check path pattern matching
    const pathMatch = this.matchPathPatterns(toolName, args);
    if (pathMatch === "deny") return "deny";
    if (pathMatch === "allow") return "auto";
    if (pathMatch === "ask") return "approve";

    // 4. Check per-tool rules for ask/allow
    if (rule === "allow") return "auto";
    if (rule === "ask") return "approve";

    // 5. Check approved allowlist
    if (this.isApproved(toolName, args)) return "auto";

    // 6. Fall back to default behavior
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

  async shouldExecute(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<[boolean, string]> {
    this.runBeforeHooks(toolName, args);

    const level = this.check(toolName, args);

    let result: [boolean, string];

    if (level === "deny") {
      await this.traces?.record(
        new TraceEntry({
          event_type: "error",
          loop_name: "permission",
          feature: "*",
          data: { tool: toolName, decision: "deny", args },
        }),
      );
      result = [false, "Denied: command matched auto-deny pattern"];
    } else if (level === "approve" && !this.autoApprove) {
      const reason = "Approval required for " + toolName;
      await this.traces?.record(
        new TraceEntry({
          event_type: "agent_step",
          loop_name: "permission",
          feature: "*",
          data: { tool: toolName, decision: "approve_required", args },
        }),
      );
      result = [false, reason];
    } else {
      result = [true, "ok"];
    }

    this.runAfterHooks(toolName, args);
    return result;
  }
}