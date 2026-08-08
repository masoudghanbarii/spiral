from __future__ import annotations

import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

from spiral.config import Config


class ProjectManager:
    def __init__(self, config: Config):
        self.config = config
        self.project_dir = config.PROJECT_DIR

    def read_adr(self) -> str:
        return self.config.ADR_PATH.read_text()

    def read_agents_md(self) -> str:
        return self.config.AGENTS_PATH.read_text()

    def update_adr(self, section: str, status: str) -> None:
        adr = self.config.ADR_PATH.read_text()
        marker = f"## {section}"
        if marker not in adr:
            return
        lines = adr.split("\n")
        new_lines = []
        found = False
        status_updated = False
        for i, line in enumerate(lines):
            if line.strip().startswith(marker):
                found = True
            if found and line.strip().startswith("**Status:**"):
                line = f"**Status:** {status}"
                found = False
                status_updated = True
            new_lines.append(line)
        if not status_updated:
            for i, line in enumerate(new_lines):
                if line.strip().startswith(marker):
                    new_lines.insert(i + 1, f"**Status:** {status}")
                    break
        self.config.ADR_PATH.write_text("\n".join(new_lines))

    def mark_adr_done(self, section: str) -> None:
        self.update_adr(section, "Done")

    def append_adr_section(self, title: str, description: str) -> None:
        adr = self.config.ADR_PATH.read_text()
        new_section = f"\n\n## {title}\n\n{description}\n\n**Status:** Pending\n"
        self.config.ADR_PATH.write_text(adr + new_section)

    def get_adr_section_names(self) -> list[str]:
        adr = self.config.ADR_PATH.read_text()
        sections = []
        for line in adr.split("\n"):
            stripped = line.strip()
            if stripped.startswith("## "):
                sections.append(stripped[3:].strip())
        return sections

    def file_exists(self, path: str) -> bool:
        return (self.project_dir / path).exists()

    def read_file(
        self, path: str, offset: int | None = None, limit: int | None = None
    ) -> str:
        f = self.project_dir / path
        if not f.exists():
            return ""
        if offset is None and limit is None:
            return f.read_text()
        lines = f.read_text().splitlines()
        start = max(0, (offset or 1) - 1)
        end = start + limit if limit else len(lines)
        selected = lines[start:end]
        numbered = [f"{start + i + 1}: {line}" for i, line in enumerate(selected)]
        return "\n".join(numbered)

    def write_file(self, path: str, content: str) -> None:
        f = self.project_dir / path
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(content)

    def edit_file(
        self, path: str, old_string: str, new_string: str, replace_all: bool = False
    ) -> str:
        f = self.project_dir / path
        if not f.exists():
            raise FileNotFoundError(f"File not found: {path}")
        content = f.read_text()
        count = content.count(old_string)
        if count == 0:
            raise ValueError(f"old_string not found in {path}")
        if count > 1 and not replace_all:
            raise ValueError(
                f"old_string found {count} times in {path}; "
                "use replaceAll=true or provide more context"
            )
        if replace_all:
            new_content = content.replace(old_string, new_string)
        else:
            new_content = content.replace(old_string, new_string, 1)
        f.write_text(new_content)
        replaced = count if replace_all else 1
        return f"Replaced {replaced} occurrence(s) in {path}"

    def glob(self, pattern: str, path: str | None = None) -> list[str]:
        base = self.project_dir / (path or "")
        return sorted(str(p.relative_to(self.project_dir)) for p in base.glob(pattern))

    def grep(
        self,
        pattern: str,
        include: str = "*",
        path: str | None = None,
        max_results: int = 100,
    ) -> list[dict[str, Any]]:
        base = self.project_dir / (path or "")
        if not base.exists():
            return []
        rg = shutil.which("rg")
        if rg:
            cmd = [
                rg,
                "--line-number",
                "--no-heading",
                "--color=never",
            ]
            if include != "*":
                cmd.extend(["--glob", include])
            cmd.extend([pattern, str(base)])
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30, check=False
            )
            matches: list[dict[str, Any]] = []
            for line in result.stdout.splitlines()[:max_results]:
                parts = line.split(":", 2)
                if len(parts) >= 3:
                    file_path, line_no, content = parts[0], parts[1], parts[2]
                    rel = str(Path(file_path).relative_to(self.project_dir))
                    matches.append(
                        {"file": rel, "line": int(line_no), "content": content}
                    )
            return matches
        regex = re.compile(pattern)
        results: list[dict[str, Any]] = []
        for fp in base.rglob("*"):
            if not fp.is_file():
                continue
            if include != "*" and not fp.match(include):
                continue
            try:
                for i, line in enumerate(fp.read_text().splitlines(), 1):
                    if regex.search(line):
                        rel = str(fp.relative_to(self.project_dir))
                        results.append({"file": rel, "line": i, "content": line})
                        if len(results) >= max_results:
                            return results
            except (OSError, UnicodeDecodeError):
                continue
        return results

    def run_command(
        self, cmd: list[str], cwd: str | None = None
    ) -> subprocess.CompletedProcess:
        return subprocess.run(
            cmd,
            cwd=cwd or str(self.project_dir),
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )

    def list_project_files(self, pattern: str = "**/*.py") -> list[str]:
        return [
            str(p.relative_to(self.project_dir)) for p in self.project_dir.glob(pattern)
        ]

    def get_project_context(self) -> dict[str, Any]:
        return {
            "adr": self.read_adr(),
            "agents_md": self.read_agents_md(),
            "files": self.list_project_files(),
            "project_dir": str(self.project_dir),
        }
