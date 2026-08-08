from __future__ import annotations

from spiral.config import Config
from spiral.managers.git import GitManager
from spiral.managers.memory import MemoryManager
from spiral.managers.permissions import PermissionManager
from spiral.managers.project import ProjectManager
from spiral.managers.skills import SkillsManager
from spiral.managers.state import StateManager
from spiral.managers.status import StatusManager
from spiral.managers.traces import TraceManager


class ManagerRegistry:
    def __init__(self, config: Config):
        self.config = config
        self.project = ProjectManager(config)
        self.state = StateManager(config)
        self.skills = SkillsManager(config)
        self.traces = TraceManager(config)
        self.status = StatusManager(config)
        self.permissions = PermissionManager(config)
        self.git = GitManager(self.project)
        self.memory = MemoryManager(config)
