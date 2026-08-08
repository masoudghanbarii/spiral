from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from spiral.config import Config
from spiral.managers.permissions import PermissionManager
from spiral.managers.project import ProjectManager
from spiral.modes import AgentMode, get_disabled_tools


class ToolRegistry:
    def __init__(
        self,
        config: Config,
        project: ProjectManager,
        permissions: PermissionManager | None = None,
        agent_mode: AgentMode = AgentMode.NORMAL,
    ):
        self.config = config
        self.project = project
        self.permissions = permissions or PermissionManager(config)
        self.agent_mode = agent_mode
        self._disabled = get_disabled_tools(agent_mode)
        self._tools: dict[str, Callable] = {}
        self._register_all()

    def _register_all(self) -> None:
        self._tools["read_file"] = self.read_file
        self._tools["write_file"] = self.write_file
        self._tools["edit_file"] = self.edit_file
        self._tools["run_tests"] = self.run_tests
        self._tools["run_lint"] = self.run_lint
        self._tools["run_command"] = self.run_command
        self._tools["list_files"] = self.list_files
        self._tools["grep"] = self.grep
        self._tools["glob"] = self.glob
        self._tools["read_adr"] = self.read_adr
        self._tools["mark_adr_done"] = self.mark_adr_done
        self._tools["find_skills"] = self.find_skills
        self._tools["add_skill"] = self.add_skill
        self._tools["read_agents_md"] = self.read_agents_md
        self._tools["git_status"] = self.git_status
        self._tools["git_diff"] = self.git_diff
        self._tools["git_add"] = self.git_add
        self._tools["git_commit"] = self.git_commit
        self._tools["git_branch"] = self.git_branch
        self._tools["git_log"] = self.git_log

    def get_tool_definitions(self) -> list[dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Read a file from the project. Use offset/limit to read specific sections of large files.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {
                                "type": "string",
                                "description": "Relative path in project",
                            },
                            "offset": {
                                "type": "integer",
                                "description": "Line number to start from (1-indexed). If omitted, reads entire file.",
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of lines to read",
                            },
                        },
                        "required": ["path"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "write_file",
                    "description": "Write content to a file in the project (overwrites entire file)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string"},
                            "content": {"type": "string"},
                        },
                        "required": ["path", "content"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "edit_file",
                    "description": "Edit a file by replacing old_string with new_string. Preserves all other content. Use replaceAll to replace multiple occurrences.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string"},
                            "old_string": {
                                "type": "string",
                                "description": "Exact text to find (must match exactly including indentation)",
                            },
                            "new_string": {
                                "type": "string",
                                "description": "Text to replace old_string with",
                            },
                            "replaceAll": {
                                "type": "boolean",
                                "description": "Replace all occurrences (default: false, errors on multiple matches)",
                            },
                        },
                        "required": ["path", "old_string", "new_string"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "grep",
                    "description": "Search file contents using regex. Returns matching lines with file paths and line numbers.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "pattern": {
                                "type": "string",
                                "description": "Regex pattern to search for",
                            },
                            "include": {
                                "type": "string",
                                "description": "File glob filter e.g. *.py (default: all files)",
                            },
                            "path": {
                                "type": "string",
                                "description": "Subdirectory to search (default: project root)",
                            },
                        },
                        "required": ["pattern"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "glob",
                    "description": "Find files by name pattern. Returns matching file paths.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "pattern": {
                                "type": "string",
                                "description": "Glob pattern like **/*.py or src/**/*.ts",
                            },
                            "path": {
                                "type": "string",
                                "description": "Subdirectory to search (default: project root)",
                            },
                        },
                        "required": ["pattern"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "run_tests",
                    "description": "Run project tests",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {
                                "type": "string",
                                "description": "Optional test path",
                            }
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "run_lint",
                    "description": "Run linters on the project",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {
                                "type": "string",
                                "description": "Optional path to lint",
                            }
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "run_command",
                    "description": "Run an arbitrary shell command in the project directory",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {
                                "type": "string",
                                "description": "Shell command to run",
                            },
                        },
                        "required": ["command"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "list_files",
                    "description": "List files in the project matching a glob pattern",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "pattern": {
                                "type": "string",
                                "description": "Glob pattern like **/*.py",
                            },
                        },
                        "required": ["pattern"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "read_adr",
                    "description": "Read the ADR architecture document",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "mark_adr_done",
                    "description": "Mark an ADR section as Done",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "section": {
                                "type": "string",
                                "description": "ADR section name",
                            }
                        },
                        "required": ["section"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "find_skills",
                    "description": "Find relevant skills for a task description",
                    "parameters": {
                        "type": "object",
                        "properties": {"task": {"type": "string"}},
                        "required": ["task"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "add_skill",
                    "description": "Add a skill from a repo",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "repo_url": {"type": "string"},
                            "skill_name": {"type": "string"},
                        },
                        "required": ["repo_url", "skill_name"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "read_agents_md",
                    "description": "Read the AGENTS.md file for project conventions",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "git_status",
                    "description": "Show git working tree status (short format)",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "git_diff",
                    "description": "Show git diff (staged or unstaged)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "staged": {
                                "type": "boolean",
                                "description": "Show staged changes (default: true)",
                            }
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "git_add",
                    "description": "Stage files for commit",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "paths": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Files to stage (default: all changes)",
                            }
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "git_commit",
                    "description": "Commit staged changes with a message",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "message": {
                                "type": "string",
                                "description": "Commit message",
                            }
                        },
                        "required": ["message"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "git_branch",
                    "description": "List, create, or switch git branches",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["list", "create", "switch"],
                                "description": "Branch action (default: list)",
                            },
                            "name": {
                                "type": "string",
                                "description": "Branch name (for create/switch)",
                            },
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "git_log",
                    "description": "Show recent git commits (oneline format)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "limit": {
                                "type": "integer",
                                "description": "Number of commits to show (default: 10)",
                            }
                        },
                    },
                },
            },
        ]

    def execute(self, name: str, args: dict[str, Any]) -> str:
        if name not in self._tools:
            return f"Error: unknown tool '{name}'"
        if name in self._disabled:
            return f"Error: tool '{name}' disabled in {self.agent_mode.value} mode"
        if self.agent_mode == AgentMode.BYPASS:
            try:
                return self._tools[name](**args)
            except (OSError, RuntimeError, ValueError, TypeError) as e:
                return f"Error executing {name}: {e}"
        allowed, reason = self.permissions.should_execute(name, args)
        if not allowed:
            return f"Error: {reason}"
        try:
            return self._tools[name](**args)
        except (OSError, RuntimeError, ValueError, TypeError) as e:
            return f"Error executing {name}: {e}"

    def read_file(
        self, path: str, offset: int | None = None, limit: int | None = None
    ) -> str:
        return self.project.read_file(path, offset=offset, limit=limit)

    def write_file(self, path: str, content: str) -> str:
        self.project.write_file(path, content)
        return f"Written {path}"

    def edit_file(
        self, path: str, old_string: str, new_string: str, replaceAll: bool = False
    ) -> str:
        return self.project.edit_file(
            path, old_string, new_string, replace_all=replaceAll
        )

    def grep(self, pattern: str, include: str = "*", path: str | None = None) -> str:
        matches = self.project.grep(pattern, include=include, path=path)
        if not matches:
            return "No matches found"
        lines = []
        for m in matches:
            lines.append(f"{m['file']}:{m['line']}: {m['content']}")
        return "\n".join(lines)

    def glob(self, pattern: str, path: str | None = None) -> str:
        files = self.project.glob(pattern, path=path)
        return "\n".join(files) if files else "No files found"

    def _resolve_test_cmd(self, path: str = "") -> list[str]:
        project_dir = Path(self.project.project_dir)
        if (project_dir / "justfile").exists():
            return ["just", "test"] if not path else ["just", f"test/{path}"]
        if (project_dir / "Makefile").exists():
            return ["make", "test"] if not path else ["make", f"test/{path}"]
        return ["python", "-m", "pytest", path] if path else ["python", "-m", "pytest"]

    def _resolve_lint_cmd(self, path: str = "") -> list[str]:
        project_dir = Path(self.project.project_dir)
        if (project_dir / "justfile").exists():
            return ["just", "lint"] if not path else ["just", f"lint/{path}"]
        if (project_dir / "Makefile").exists():
            return ["make", "lint"] if not path else ["make", f"lint/{path}"]
        return (
            ["python", "-m", "ruff", "check", path]
            if path
            else ["python", "-m", "ruff", "check", "."]
        )

    def run_tests(self, path: str = "") -> str:
        cmd = self._resolve_test_cmd(path)
        result = self.project.run_command(cmd)
        return result.stdout[-2000:] + result.stderr[-2000:]

    def run_lint(self, path: str = "") -> str:
        cmd = self._resolve_lint_cmd(path)
        result = self.project.run_command(cmd)
        return result.stdout[-2000:] + result.stderr[-2000:]

    def run_command(self, command: str) -> str:
        result = self.project.run_command(["bash", "-c", command])
        return result.stdout[-3000:] + result.stderr[-1000:]

    def list_files(self, pattern: str = "**/*.py") -> str:
        files = self.project.list_project_files(pattern)
        return "\n".join(files[:100])

    def read_adr(self) -> str:
        return self.project.read_adr()

    def mark_adr_done(self, section: str) -> str:
        self.project.mark_adr_done(section)
        return f"ADR section '{section}' marked Done"

    def find_skills(self, task: str) -> str:
        from spiral.managers.skills import SkillsManager

        sm = SkillsManager(self.config)
        skills = sm.find_skills(task)
        return f"Found skills: {', '.join(skills)}" if skills else "No skills found"

    def add_skill(self, repo_url: str, skill_name: str) -> str:
        from spiral.managers.skills import SkillsManager

        sm = SkillsManager(self.config)
        ok = sm.ensure_skill(skill_name, repo_url)
        return (
            f"Skill '{skill_name}' added"
            if ok
            else f"Failed to add skill '{skill_name}'"
        )

    def read_agents_md(self) -> str:
        return self.project.read_agents_md()

    def git_status(self) -> str:
        from spiral.managers.git import GitManager

        gm = GitManager(self.project)
        return gm.status()

    def git_diff(self, staged: bool = True) -> str:
        from spiral.managers.git import GitManager

        gm = GitManager(self.project)
        return gm.diff(staged=staged)

    def git_add(self, paths: list[str] | None = None) -> str:
        from spiral.managers.git import GitManager

        gm = GitManager(self.project)
        return gm.add(paths=paths)

    def git_commit(self, message: str) -> str:
        from spiral.managers.git import GitManager

        gm = GitManager(self.project)
        return gm.commit(message)

    def git_branch(self, action: str = "list", name: str | None = None) -> str:
        from spiral.managers.git import GitManager

        gm = GitManager(self.project)
        return gm.branch(action=action, name=name)

    def git_log(self, limit: int = 10) -> str:
        from spiral.managers.git import GitManager

        gm = GitManager(self.project)
        return gm.log(limit=limit)
