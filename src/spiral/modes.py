from __future__ import annotations

from enum import Enum


class AgentMode(str, Enum):
    NORMAL = "normal"
    PLAN = "plan"
    BYPASS = "bypass"
    INTERACTIVE = "interactive"
    SAFE = "safe"


PLAN_DISABLED_TOOLS = frozenset(
    {
        "write_file",
        "edit_file",
        "run_command",
        "mark_adr_done",
        "git_add",
        "git_commit",
        "git_branch",
    }
)

SAFE_DISABLED_TOOLS = frozenset(
    {
        "write_file",
        "edit_file",
        "run_command",
        "mark_adr_done",
        "git_add",
        "git_commit",
        "git_branch",
        "run_tests",
        "run_lint",
        "add_skill",
    }
)

SAFE_ALLOWED_TOOLS = frozenset(
    {
        "read_file",
        "grep",
        "glob",
        "list_files",
        "read_adr",
        "read_agents_md",
        "find_skills",
    }
)


def get_disabled_tools(mode: AgentMode) -> frozenset[str]:
    if mode == AgentMode.PLAN:
        return PLAN_DISABLED_TOOLS
    if mode == AgentMode.SAFE:
        return SAFE_DISABLED_TOOLS
    return frozenset()


def get_system_prompt_suffix(mode: AgentMode) -> str:
    if mode == AgentMode.PLAN:
        return (
            "\n\nIMPORTANT: You are in PLAN MODE. Do not write or modify any files. "
            "Do not execute commands that change state. "
            "Read the codebase, analyze the requirements, and output a detailed "
            "implementation plan. Include: files to create/modify, approach, "
            "potential risks, and testing strategy."
        )
    if mode == AgentMode.SAFE:
        return (
            "\n\nIMPORTANT: You are in SAFE MODE. You have read-only access. "
            "Do not attempt to write, edit, or execute commands. "
            "Analyze the codebase and report findings only."
        )
    if mode == AgentMode.BYPASS:
        return "\n\nNOTE: Bypass permissions mode active. All tools enabled without approval."
    if mode == AgentMode.INTERACTIVE:
        return (
            "\n\nNOTE: Interactive mode active. The user may interject at any time. "
            "Pay attention to user messages and adjust your approach accordingly."
        )
    return ""
