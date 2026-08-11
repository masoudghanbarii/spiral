import { Config } from "../config.js";
import { ProjectManager } from "./project.js";
import { StateManager } from "./state.js";
import { StatusManager } from "./status.js";
import { TraceManager } from "./traces.js";
import { PermissionManager } from "./permissions.js";
import { GitManager } from "./git.js";
import { MemoryManager } from "./memory.js";
import { SessionManager } from "./sessions.js";
import { MCPManager } from "./mcp.js";
import { PluginManager } from "../plugins/index.js";
import { SkillManager } from "../skills/index.js";

export class ManagerRegistry {
  config: Config;
  project: ProjectManager;
  state: StateManager;
  status: StatusManager;
  traces: TraceManager;
  permissions: PermissionManager;
  git: GitManager;
  memory: MemoryManager;
  sessions: SessionManager;
  mcp: MCPManager;
  plugins: PluginManager;
  skills: SkillManager;

  constructor(config: Config) {
    this.config = config;
    this.project = new ProjectManager(config);
    this.state = new StateManager(config);
    this.status = new StatusManager(config);
    this.traces = new TraceManager(config);
    this.permissions = new PermissionManager(config, this.traces);
    this.git = new GitManager(this.project);
    this.memory = new MemoryManager(config);
    this.sessions = new SessionManager(this.memory);
    this.mcp = new MCPManager();
    this.plugins = new PluginManager({
      config,
      project: this.project,
      memory: this.memory,
    });
    this.skills = new SkillManager(config.skillsDir);
  }
}
