from __future__ import annotations

import re
from enum import Enum
from typing import Any

from spiral.config import Config
from spiral.models import TraceEntry, TraceEventType


class PermissionLevel(str, Enum):
    AUTO = "auto"
    APPROVE = "approve"
    DENY = "deny"


DESTRUCTIVE_TOOLS = frozenset(
    {
        "write_file",
        "edit_file",
        "run_command",
        "mark_adr_done",
        "git_commit",
        "git_add",
        "git_branch",
    }
)

AUTO_DENY_PATTERNS = [
    re.compile(r"rm\s+-rf\s+/", re.IGNORECASE),
    re.compile(r"git\s+push\s+--force", re.IGNORECASE),
    re.compile(r"git\s+push\s+-f\b", re.IGNORECASE),
    re.compile(r"\bsudo\b", re.IGNORECASE),
    re.compile(r"chmod\s+777", re.IGNORECASE),
    re.compile(r"\bdd\s+of=", re.IGNORECASE),
    re.compile(r"mkfs\b", re.IGNORECASE),
    re.compile(r">\s*/dev/sd", re.IGNORECASE),
    re.compile(r"shutdown\b", re.IGNORECASE),
    re.compile(r"reboot\b", re.IGNORECASE),
]

PROTECTED_PATHS = [
    re.compile(r"\.env\b", re.IGNORECASE),
    re.compile(r"/etc/"),
    re.compile(r"~/.ssh/"),
]


class PermissionManager:
    def __init__(self, config: Config):
        self.config = config
        self.auto_approve = bool(getattr(config, "AUTO_APPROVE", False))

    def check(self, tool_name: str, args: dict[str, Any]) -> PermissionLevel:
        if self._is_deny_pattern(tool_name, args):
            return PermissionLevel.DENY
        if self.auto_approve or tool_name not in DESTRUCTIVE_TOOLS:
            return PermissionLevel.AUTO
        if self._is_protected_path(tool_name, args):
            return PermissionLevel.APPROVE
        return PermissionLevel.APPROVE

    def _is_deny_pattern(self, tool_name: str, args: dict[str, Any]) -> bool:
        if tool_name != "run_command":
            return False
        command = args.get("command", "")
        if not isinstance(command, str):
            return False
        return any(p.search(command) for p in AUTO_DENY_PATTERNS)

    def _is_protected_path(self, tool_name: str, args: dict[str, Any]) -> bool:
        if tool_name not in ("write_file", "edit_file"):
            return False
        path = args.get("path", "")
        if not isinstance(path, str):
            return False
        return any(p.search(path) for p in PROTECTED_PATHS)

    def should_execute(
        self,
        tool_name: str,
        args: dict[str, Any],
        traces: Any | None = None,
    ) -> tuple[bool, str]:
        level = self.check(tool_name, args)
        if level == PermissionLevel.DENY:
            reason = "Denied: command matched auto-deny pattern"
            if traces:
                traces.record(
                    TraceEntry(
                        event_type=TraceEventType.ERROR,
                        loop_name="permission",
                        feature="*",
                        data={"tool": tool_name, "decision": "deny", "args": args},
                    )
                )
            return False, reason
        if level == PermissionLevel.APPROVE and not self.auto_approve:
            reason = f"Approval required for {tool_name} on protected path"
            if traces:
                traces.record(
                    TraceEntry(
                        event_type=TraceEventType.AGENT_STEP,
                        loop_name="permission",
                        feature="*",
                        data={
                            "tool": tool_name,
                            "decision": "approve_required",
                            "args": args,
                        },
                    )
                )
            return False, reason
        return True, "ok"
