import type { AgentMode } from "./types.js";

const PLAN_DISABLED = new Set([
  "write_file",
  "edit_file",
  "run_command",
  "mark_adr_done",
  "git_add",
  "git_commit",
  "git_branch",
]);

const SAFE_DISABLED = new Set([...PLAN_DISABLED, "run_tests", "run_lint", "add_skill"]);

export function getDisabledTools(mode: AgentMode): Set<string> {
  if (mode === "plan") return PLAN_DISABLED;
  if (mode === "safe") return SAFE_DISABLED;
  return new Set();
}

export function getSystemPromptSuffix(mode: AgentMode): string {
  switch (mode) {
    case "plan":
      return (
        "\n\nIMPORTANT: You are in PLAN MODE. Do not write or modify any files. " +
        "Do not execute commands that change state. " +
        "Read the codebase, analyze the requirements, and output a detailed " +
        "implementation plan. Include: files to create/modify, approach, " +
        "potential risks, and testing strategy."
      );
    case "safe":
      return (
        "\n\nIMPORTANT: You are in SAFE MODE. You have read-only access. " +
        "Do not attempt to write, edit, or execute commands. " +
        "Analyze the codebase and report findings only."
      );
    case "bypass":
      return "\n\nNOTE: Bypass permissions mode active. All tools enabled without approval.";
    case "interactive":
      return (
        "\n\nNOTE: Interactive mode active. The user may interject at any time. " +
        "Pay attention to user messages and adjust your approach accordingly."
      );
    default:
      return "";
  }
}
