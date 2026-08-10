import type { ProjectManager } from "./project.js";

export class GitManager {
  private project: ProjectManager;

  constructor(project: ProjectManager) {
    this.project = project;
  }

  private async git(args: string[]): Promise<string> {
    const { stdout, stderr } = await this.project.runCommand(["git", ...args]);
    return stdout + stderr;
  }

  async status(): Promise<string> {
    return this.git(["status", "--short"]);
  }

  async diff(staged = true): Promise<string> {
    const args = ["diff"];
    if (staged) args.push("--staged");
    return this.git(args);
  }

  async add(paths?: string[]): Promise<string> {
    const args = ["add", ...(paths ?? ["."])];
    return this.git(args);
  }

  async commit(message: string): Promise<string> {
    return this.git(["commit", "-m", message]);
  }

  async branch(action = "list", name?: string): Promise<string> {
    if (action === "list") return this.git(["branch"]);
    if (action === "create" && name) return this.git(["branch", name]);
    if (action === "switch" && name) return this.git(["switch", name]);
    return `Error: unknown branch action '${action}'`;
  }

  async log(limit = 10): Promise<string> {
    return this.git(["log", "--oneline", `-${limit}`]);
  }

  async isRepo(): Promise<boolean> {
    const { code } = await this.project.runCommand(["git", "rev-parse", "--is-inside-work-tree"]);
    return code === 0;
  }
}
