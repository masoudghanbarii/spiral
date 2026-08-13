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
    case "loop":
      return (
        "\n\nIMPORTANT: You are in LOOP MODE — god mode. All tools are enabled without approval.\n" +
        "This is a continuous development loop.\n" +
        "Follow this cycle:\n" +
        "1. Implement the requested feature or fix\n" +
        "2. Run tests (run_tests) and lint (run_lint)\n" +
        "3. If tests fail, read the errors and fix them\n" +
        "4. Repeat steps 2-3 until all tests pass\n" +
        "5. When tests pass, summarize what was done and ask the user if the goal is achieved\n" +
        "6. If the user says it is not done, continue implementing based on their feedback\n" +
        "7. Do NOT stop until the user confirms the goal is achieved or tells you to stop\n" +
        "\nFor casual conversation (greetings, questions about yourself), respond naturally without tools.\n" +
        "Do not ask for approval — just run tools directly. Be thorough:\n" +
        "test edge cases, check for regressions, verify the implementation works."
      );
    default:
      return "";
  }
}
