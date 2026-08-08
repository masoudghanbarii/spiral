from __future__ import annotations

from spiral.managers.project import ProjectManager


class GitManager:
    def __init__(self, project: ProjectManager):
        self.project = project

    def _git(self, args: list[str]) -> str:
        result = self.project.run_command(["git", *args])
        return result.stdout + result.stderr

    def status(self) -> str:
        return self._git(["status", "--short"])

    def diff(self, staged: bool = True) -> str:
        args = ["diff"]
        if staged:
            args.append("--staged")
        return self._git(args)

    def add(self, paths: list[str] | None = None) -> str:
        args = ["add"]
        args.extend(paths if paths else ["."])
        return self._git(args)

    def commit(self, message: str) -> str:
        return self._git(["commit", "-m", message])

    def branch(self, action: str = "list", name: str | None = None) -> str:
        if action == "list":
            return self._git(["branch"])
        if action == "create" and name:
            return self._git(["branch", name])
        if action == "switch" and name:
            return self._git(["switch", name])
        return f"Error: unknown branch action '{action}'"

    def log(self, limit: int = 10) -> str:
        return self._git(["log", "--oneline", f"-{limit}"])

    def is_repo(self) -> bool:
        result = self.project.run_command(["git", "rev-parse", "--is-inside-work-tree"])
        return result.returncode == 0
