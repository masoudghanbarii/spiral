from __future__ import annotations

import json
import logging
import shutil
import subprocess

from spiral.config import Config

logger = logging.getLogger(__name__)


class SkillsManager:
    def __init__(self, config: Config):
        self.config = config
        self.skills_dir = config.SKILLS_DIR
        self.skills_dir.mkdir(parents=True, exist_ok=True)

    def find_skills(self, task_description: str) -> list[str]:
        if not shutil.which("npx"):
            logger.warning("npx not found in PATH; skipping skill discovery")
            return []
        try:
            result = subprocess.run(
                [
                    "npx",
                    "skills",
                    "add",
                    "https://github.com/vercel-labs/skills",
                    "--skill",
                    "find-skills",
                ],
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
            )
            if result.returncode == 0:
                return self._parse_skills_output(result.stdout, task_description)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        return []

    def add_skill(self, repo_url: str, skill_name: str) -> bool:
        if not shutil.which("npx"):
            logger.warning("npx not found in PATH; cannot add skill %s", skill_name)
            return False
        try:
            result = subprocess.run(
                ["npx", "skills", "add", repo_url, "--skill", skill_name],
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False

    def _parse_skills_output(self, output: str, task: str) -> list[str]:
        skills = []
        # Try JSON array first
        try:
            data = json.loads(output)
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, str) and item:
                        skills.append(item)
                return skills
        except json.JSONDecodeError:
            pass
        for line in output.split("\n"):
            if "--skill" in line:
                parts = line.split("--skill")
                if len(parts) > 1:
                    skills.append(parts[1].strip().split()[0])
        for token in output.split():
            token = token.strip("`'")
            if token and token not in skills:
                skills.append(token)
        return skills

    def get_skill_instructions(self, skill_name: str) -> str:
        skill_file = self.skills_dir / f"{skill_name}.md"
        if skill_file.exists():
            return skill_file.read_text()
        return ""

    def ensure_skill(self, skill_name: str, repo_url: str) -> bool:
        skill_file = self.skills_dir / f"{skill_name}.md"
        if skill_file.exists():
            return True
        return self.add_skill(repo_url, skill_name)
