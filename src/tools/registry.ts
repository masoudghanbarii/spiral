import path from "node:path";
import { existsSync } from "node:fs";
import { Config } from "../config.js";
import type { ProjectManager } from "../managers/project.js";
import type { PermissionManager } from "../managers/permissions.js";
import type { ToolDefinition } from "../types.js";
import type { AgentMode } from "../types.js";
import { getDisabledTools } from "../modes.js";

type ToolFn = (args: Record<string, unknown>) => Promise<string>;

export class ToolRegistry {
  private _config: Config;
  private project: ProjectManager;
  private permissions: PermissionManager;
  private agentMode: AgentMode;
  private disabled: Set<string>;
  private tools: Map<string, ToolFn> = new Map();

  constructor(
    config: Config,
    project: ProjectManager,
    permissions: PermissionManager,
    agentMode: AgentMode = "normal",
  ) {
    this._config = config;
    void this._config;
    this.project = project;
    this.permissions = permissions;
    this.agentMode = agentMode;
    this.disabled = getDisabledTools(agentMode);
    this.registerAll();
  }

  private registerAll(): void {
    this.tools.set("read_file", (a) => this.readFile(a));
    this.tools.set("write_file", (a) => this.writeFile(a));
    this.tools.set("edit_file", (a) => this.editFile(a));
    this.tools.set("run_tests", () => this.runTests());
    this.tools.set("run_lint", () => this.runLint());
    this.tools.set("run_command", (a) => this.runCommand(a));
    this.tools.set("list_files", (a) => this.listFiles(a));
    this.tools.set("grep", (a) => this.grep(a));
    this.tools.set("glob", (a) => this.glob(a));
    this.tools.set("read_adr", () => this.readAdr());
    this.tools.set("mark_adr_done", (a) => this.markAdrDone(a));
    this.tools.set("read_agents_md", () => this.readAgentsMd());
    this.tools.set("git_status", () => this.gitStatus());
    this.tools.set("git_diff", (a) => this.gitDiff(a));
    this.tools.set("git_add", (a) => this.gitAdd(a));
    this.tools.set("git_commit", (a) => this.gitCommit(a));
    this.tools.set("git_branch", (a) => this.gitBranch(a));
    this.tools.set("git_log", (a) => this.gitLog(a));
  }

  getToolDefinitions(): ToolDefinition[] {
    return [
      def(
        "read_file",
        "Read a file from the project",
        {
          path: { type: "string", description: "Relative path in project" },
          offset: { type: "integer", description: "Line number to start from (1-indexed)" },
          limit: { type: "integer", description: "Maximum lines to read" },
        },
        ["path"],
      ),
      def(
        "write_file",
        "Write content to a file (overwrites)",
        {
          path: { type: "string" },
          content: { type: "string" },
        },
        ["path", "content"],
      ),
      def(
        "edit_file",
        "Edit file by replacing old_string with new_string",
        {
          path: { type: "string" },
          old_string: { type: "string" },
          new_string: { type: "string" },
          replaceAll: { type: "boolean" },
        },
        ["path", "old_string", "new_string"],
      ),
      def(
        "grep",
        "Search file contents using regex",
        {
          pattern: { type: "string" },
          include: { type: "string" },
          subdir: { type: "string" },
        },
        ["pattern"],
      ),
      def(
        "glob",
        "Find files by name pattern",
        {
          pattern: { type: "string" },
          subdir: { type: "string" },
        },
        ["pattern"],
      ),
      def("run_tests", "Run project tests", {}),
      def("run_lint", "Run linters", {}),
      def(
        "run_command",
        "Run a shell command",
        {
          command: { type: "string" },
        },
        ["command"],
      ),
      def("list_files", "List files matching a glob", {
        pattern: { type: "string" },
      }),
      def("read_adr", "Read the ADR document", {}),
      def(
        "mark_adr_done",
        "Mark an ADR section as Done",
        {
          section: { type: "string" },
        },
        ["section"],
      ),
      def("read_agents_md", "Read AGENTS.md", {}),
      def("git_status", "Show git status", {}),
      def("git_diff", "Show git diff", {
        staged: { type: "boolean" },
      }),
      def("git_add", "Stage files", {
        paths: { type: "array", items: { type: "string" } },
      }),
      def(
        "git_commit",
        "Commit staged changes",
        {
          message: { type: "string" },
        },
        ["message"],
      ),
      def("git_branch", "List/create/switch branches", {
        action: { type: "string", enum: ["list", "create", "switch"] },
        name: { type: "string" },
      }),
      def("git_log", "Show recent commits", {
        limit: { type: "integer" },
      }),
    ];
  }

  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const fn = this.tools.get(name);
    if (!fn) return `Error: unknown tool '${name}'`;
    if (this.disabled.has(name)) return `Error: tool '${name}' disabled in ${this.agentMode} mode`;
    if (this.agentMode !== "bypass") {
      const [allowed, reason] = await this.permissions.shouldExecute(name, args);
      if (!allowed) return `Error: ${reason}`;
    }
    try {
      return await fn(args);
    } catch (e) {
      return `Error executing ${name}: ${(e as Error).message}`;
    }
  }

  private async readFile(a: Record<string, unknown>): Promise<string> {
    return this.project.readFile(
      String(a.path),
      a.offset !== undefined ? Number(a.offset) : undefined,
      a.limit !== undefined ? Number(a.limit) : undefined,
    );
  }

  private async writeFile(a: Record<string, unknown>): Promise<string> {
    await this.project.writeFile(String(a.path), String(a.content));
    return `Written ${String(a.path)}`;
  }

  private async editFile(a: Record<string, unknown>): Promise<string> {
    return this.project.editFile(
      String(a.path),
      String(a.old_string),
      String(a.new_string),
      Boolean(a.replaceAll),
    );
  }

  private async grep(a: Record<string, unknown>): Promise<string> {
    const matches = await this.project.grep(String(a.pattern), {
      include: a.include !== undefined ? String(a.include) : undefined,
      subdir: a.subdir !== undefined ? String(a.subdir) : undefined,
    });
    if (matches.length === 0) return "No matches found";
    return matches.map((m) => `${m.file}:${m.line}: ${m.content}`).join("\n");
  }

  private async glob(a: Record<string, unknown>): Promise<string> {
    const files = await this.project.glob(
      String(a.pattern),
      a.subdir !== undefined ? String(a.subdir) : undefined,
    );
    return files.length > 0 ? files.join("\n") : "No files found";
  }

  private async runTests(): Promise<string> {
    const cmd = this.resolveTestCmd();
    const { stdout, stderr } = await this.project.runCommand(cmd);
    return stdout.slice(-2000) + stderr.slice(-2000);
  }

  private async runLint(): Promise<string> {
    const cmd = this.resolveLintCmd();
    const { stdout, stderr } = await this.project.runCommand(cmd);
    return stdout.slice(-2000) + stderr.slice(-2000);
  }

  private async runCommand(a: Record<string, unknown>): Promise<string> {
    const { stdout, stderr } = await this.project.runCommand(["bash", "-c", String(a.command)]);
    return stdout.slice(-3000) + stderr.slice(-1000);
  }

  private async listFiles(a: Record<string, unknown>): Promise<string> {
    const files = await this.project.glob(a.pattern !== undefined ? String(a.pattern) : "**/*.ts");
    return files.slice(0, 100).join("\n");
  }

  private async readAdr(): Promise<string> {
    return this.project.readAdr();
  }

  private async markAdrDone(a: Record<string, unknown>): Promise<string> {
    await this.project.markAdrDone(String(a.section));
    return `ADR section '${String(a.section)}' marked Done`;
  }

  private async readAgentsMd(): Promise<string> {
    return this.project.readAgentsMd();
  }

  private resolveTestCmd(): string[] {
    const projectDir = this.project.projectDir;
    if (existsSync(path.join(projectDir, "package.json"))) return ["npm", "test"];
    if (existsSync(path.join(projectDir, "justfile"))) return ["just", "test"];
    if (existsSync(path.join(projectDir, "Makefile"))) return ["make", "test"];
    return ["npm", "test"];
  }

  private resolveLintCmd(): string[] {
    const projectDir = this.project.projectDir;
    if (existsSync(path.join(projectDir, "package.json"))) return ["npm", "run", "lint"];
    if (existsSync(path.join(projectDir, "justfile"))) return ["just", "lint"];
    if (existsSync(path.join(projectDir, "Makefile"))) return ["make", "lint"];
    return ["npx", "oxlint", "."];
  }

  private async gitStatus(): Promise<string> {
    const { GitManager } = await import("../managers/git.js");
    return new GitManager(this.project).status();
  }

  private async gitDiff(a: Record<string, unknown>): Promise<string> {
    const { GitManager } = await import("../managers/git.js");
    return new GitManager(this.project).diff(a.staged !== false);
  }

  private async gitAdd(a: Record<string, unknown>): Promise<string> {
    const { GitManager } = await import("../managers/git.js");
    return new GitManager(this.project).add(a.paths as string[] | undefined);
  }

  private async gitCommit(a: Record<string, unknown>): Promise<string> {
    const { GitManager } = await import("../managers/git.js");
    return new GitManager(this.project).commit(String(a.message));
  }

  private async gitBranch(a: Record<string, unknown>): Promise<string> {
    const { GitManager } = await import("../managers/git.js");
    return new GitManager(this.project).branch(
      a.action !== undefined ? String(a.action) : "list",
      a.name !== undefined ? String(a.name) : undefined,
    );
  }

  private async gitLog(a: Record<string, unknown>): Promise<string> {
    const { GitManager } = await import("../managers/git.js");
    return new GitManager(this.project).log(a.limit !== undefined ? Number(a.limit) : 10);
  }
}

function def(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[] = [],
): ToolDefinition {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
      },
    },
  };
}
