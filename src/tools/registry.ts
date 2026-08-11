import path from "node:path";
import { existsSync } from "node:fs";
import { readFile as fsReadFile } from "node:fs/promises";
import { Config } from "../config.js";
import type { ProjectManager } from "../managers/project.js";
import type { PermissionManager } from "../managers/permissions.js";
import type { MemoryManager } from "../managers/memory.js";
import type { ToolDefinition } from "../types.js";
import type { AgentMode } from "../types.js";
import { getDisabledTools } from "../modes.js";

type ToolFn = (args: Record<string, unknown>) => Promise<string>;

interface TodoItem {
  task: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high";
  created: number;
}

export class ToolRegistry {
  private _config: Config;
  private project: ProjectManager;
  private permissions: PermissionManager;
  private memory: MemoryManager | null;
  private agentMode: AgentMode;
  private disabled: Set<string>;
  private tools: Map<string, ToolFn> = new Map();
  private todos: Map<number, TodoItem> = new Map();
  private todoIdCounter = 0;

  constructor(
    config: Config,
    project: ProjectManager,
    permissions: PermissionManager,
    agentMode: AgentMode = "normal",
    memory?: MemoryManager,
  ) {
    this._config = config;
    this.memory = memory ?? null;
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
    this.tools.set("webfetch", (a) => this.webFetch(a));
    this.tools.set("websearch", (a) => this.webSearch(a));
    this.tools.set("todo", (a) => this.todoTool(a));
    this.tools.set("question", (a) => this.questionTool(a));
    this.tools.set("apply_patch", (a) => this.applyPatch(a));
    this.tools.set("memory_recall", (a) => this.memoryRecall(a));
    this.tools.set("memory_retain", (a) => this.memoryRetain(a));
    this.tools.set("code_review", (a) => this.codeReview(a));
    this.tools.set("find_skills", (a) => this.findSkills(a));
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
      def(
        "webfetch",
        "Fetch a URL and return content as text/markdown",
        {
          url: { type: "string", description: "URL to fetch" },
        },
        ["url"],
      ),
      def(
        "websearch",
        "Web search via Exa API or DuckDuckGo fallback",
        {
          query: { type: "string", description: "Search query" },
          max_results: { type: "integer", description: "Max results (default 5)" },
        },
        ["query"],
      ),
      def(
        "todo",
        "Task tracking within session",
        {
          action: {
            type: "string",
            enum: ["add", "list", "update", "remove"],
            description: "Todo action",
          },
          task: { type: "string", description: "Task description (or ID for update/remove)" },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "blocked"],
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
        },
        ["action"],
      ),
      def(
        "question",
        "Ask user a question (displays in TUI)",
        {
          question: { type: "string", description: "Question text" },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Optional multiple-choice options",
          },
        },
        ["question"],
      ),
      def(
        "apply_patch",
        "Apply a unified diff patch",
        {
          patch: { type: "string", description: "Unified diff patch content" },
        },
        ["patch"],
      ),
      def(
        "memory_recall",
        "Search project memory for context",
        {
          query: { type: "string", description: "Search query" },
        },
        ["query"],
      ),
      def(
        "memory_retain",
        "Store a fact in project memory",
        {
          key: { type: "string", description: "Fact key" },
          value: { type: "string", description: "Fact value" },
        },
        ["key", "value"],
      ),
      def(
        "code_review",
        "Review code in a file or directory",
        {
          path: { type: "string", description: "File or directory to review" },
          focus: { type: "string", description: "Review focus area (optional)" },
        },
        ["path"],
      ),
      def(
        "find_skills",
        "Search for available skills",
        {
          query: { type: "string", description: "Search query (optional)" },
        },
      ),
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

  // ── existing file tools ───────────────────────────────────

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

  // ── webfetch ──────────────────────────────────────────────

  private async webFetch(a: Record<string, unknown>): Promise<string> {
    const url = String(a.url);
    const resp = await fetch(url, {
      headers: { "User-Agent": "SpiralAgent/1.0" },
      redirect: "follow",
    });
    if (!resp.ok) return `Error: HTTP ${resp.status} ${resp.statusText}`;
    const contentType = resp.headers.get("content-type") ?? "";
    let html = await resp.text();
    if (contentType.includes("text/html")) {
      html = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
    }
    return html.slice(0, 3000);
  }

  // ── websearch ─────────────────────────────────────────────

  private async webSearch(a: Record<string, unknown>): Promise<string> {
    const query = String(a.query);
    const maxResults = a.max_results !== undefined ? Number(a.max_results) : 5;
    const exaKey = process.env.EXA_API_KEY;
    if (exaKey) {
      return this.exaSearch(query, maxResults, exaKey);
    }
    return this.ddgSearch(query, maxResults);
  }

  private async exaSearch(query: string, maxResults: number, apiKey: string): Promise<string> {
    const resp = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ query, numResults: maxResults }),
    });
    if (!resp.ok) return `Exa API error: ${resp.status} ${resp.statusText}`;
    const data = (await resp.json()) as {
      results?: Array<{ title?: string; url?: string; text?: string }>;
    };
    const results = data.results ?? [];
    if (results.length === 0) return "No results found";
    return results
      .map(
        (r, i) =>
          `${i + 1}. ${r.title ?? "Untitled"}\n   ${r.url ?? ""}\n   ${(r.text ?? "").slice(0, 200)}`,
      )
      .join("\n\n");
  }

  private async ddgSearch(query: string, maxResults: number): Promise<string> {
    const resp = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: { "User-Agent": "SpiralAgent/1.0" },
      },
    );
    if (!resp.ok) return `DuckDuckGo error: ${resp.status}`;
    const html = await resp.text();
    const results: string[] = [];
    const linkRegex = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>(.*?)<\/a>/gi;
    const links: Array<{ url: string; title: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(html)) !== null && links.length < maxResults) {
      const rawUrl = m[1] ?? "";
      const title = (m[2] ?? "")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      const url = rawUrl.startsWith("http") ? rawUrl : `https://duckduckgo.com${rawUrl}`;
      links.push({ url, title });
    }
    const snippets: string[] = [];
    while ((m = snippetRegex.exec(html)) !== null) {
      snippets.push(
        (m[1] ?? "")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim(),
      );
    }
    for (let i = 0; i < links.length; i++) {
      results.push(
        `${i + 1}. ${links[i]!.title}\n   ${links[i]!.url}\n   ${snippets[i] ?? ""}`,
      );
    }
    return results.length > 0 ? results.join("\n\n") : "No results found";
  }

  // ── todo ──────────────────────────────────────────────────

  private async todoTool(a: Record<string, unknown>): Promise<string> {
    const action = String(a.action ?? "list");
    switch (action) {
      case "add": {
        const task = String(a.task ?? "");
        if (!task) return "Error: task is required for add action";
        const status = (a.status as TodoItem["status"]) ?? "pending";
        const priority = (a.priority as TodoItem["priority"]) ?? "medium";
        const id = ++this.todoIdCounter;
        this.todos.set(id, { task, status, priority, created: Date.now() });
        return `Added todo #${id}: ${task}`;
      }
      case "list": {
        if (this.todos.size === 0) return "No todos.";
        const items = Array.from(this.todos.entries()).sort(
          ([idA], [idB]) => idA - idB,
        );
        return items
          .map(([id, t]) => `#${id} [${t.status}] (${t.priority}) ${t.task}`)
          .join("\n");
      }
      case "update": {
        const id = Number(a.task);
        if (isNaN(id) || !this.todos.has(id))
          return `Error: todo #${a.task} not found. Use list to see IDs.`;
        const item = this.todos.get(id)!;
        if (a.status !== undefined) item.status = a.status as TodoItem["status"];
        if (a.priority !== undefined) item.priority = a.priority as TodoItem["priority"];
        return `Updated todo #${id}: [${item.status}] (${item.priority}) ${item.task}`;
      }
      case "remove": {
        const id = Number(a.task);
        if (isNaN(id) || !this.todos.has(id))
          return `Error: todo #${a.task} not found`;
        this.todos.delete(id);
        return `Removed todo #${id}`;
      }
      default:
        return `Error: unknown todo action '${action}'`;
    }
  }

  // ── question ─────────────────────────────────────────────

  private async questionTool(a: Record<string, unknown>): Promise<string> {
    const q = String(a.question);
    const options = a.options as string[] | undefined;
    let text = `\u2728 ${q}`;
    if (options && options.length > 0) {
      text += "\n" + options.map((o, i) => `  ${i + 1}. ${o}`).join("\n");
    }
    return text;
  }

  // ── apply_patch ───────────────────────────────────────────

  private async applyPatch(a: Record<string, unknown>): Promise<string> {
    const patchText = String(a.patch);
    const lines = patchText.split("\n");
    const results: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i]!;
      if (
        line.startsWith("diff --git") ||
        line.startsWith("--- ") ||
        line.startsWith("+++ ")
      ) {
        let oldPath = "";
        let newPath = "";
        if (line.startsWith("--- ")) {
          oldPath = line.slice(4).replace(/^a\//, "");
          i++;
        } else if (line.startsWith("diff --git")) {
          const match = line.match(/diff --git a\/(\S+) b\/(\S+)/);
          if (match) {
            oldPath = match[1]!;
            newPath = match[2]!;
          }
          i++;
          while (i < lines.length && !lines[i]!.startsWith("--- ")) i++;
          if (i < lines.length) {
            oldPath = lines[i]!.slice(4).replace(/^a\//, "");
            i++;
          }
        } else {
          i++;
        }
        if (i < lines.length && lines[i]!.startsWith("+++ ")) {
          newPath = lines[i]!.slice(4).replace(/^b\//, "");
          i++;
        }
        if (!newPath) newPath = oldPath;
        const hunks: Array<{
          oldStart: number;
          oldLines: string[];
          newLines: string[];
        }> = [];
        while (
          i < lines.length &&
          (lines[i]!.startsWith("@@") ||
            lines[i]!.startsWith(" ") ||
            lines[i]!.startsWith("-") ||
            lines[i]!.startsWith("+"))
        ) {
          if (lines[i]!.startsWith("@@")) {
            const hunkMatch = lines[i]!.match(
              /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/,
            );
            const oldStart = hunkMatch ? parseInt(hunkMatch[1]!, 10) : 1;
            i++;
            const oldLines: string[] = [];
            const newLines: string[] = [];
            while (
              i < lines.length &&
              !lines[i]!.startsWith("@@") &&
              !lines[i]!.startsWith("diff --git") &&
              !lines[i]!.startsWith("--- ") &&
              !lines[i]!.startsWith("+++ ")
            ) {
              const hline = lines[i]!;
              if (hline.startsWith("-")) oldLines.push(hline.slice(1));
              else if (hline.startsWith("+")) newLines.push(hline.slice(1));
              else if (hline.startsWith(" ")) {
                oldLines.push(hline.slice(1));
                newLines.push(hline.slice(1));
              } else if (hline === "") {
                oldLines.push("");
                newLines.push("");
              }
              i++;
            }
            hunks.push({ oldStart, oldLines, newLines });
          } else {
            i++;
          }
        }
        if (oldPath === "/dev/null") {
          const content = hunks.map((h) => h.newLines.join("\n")).join("\n");
          await this.project.writeFile(newPath, content);
          results.push(`Created ${newPath}`);
        } else if (newPath === "/dev/null") {
          await this.project.runCommand(["rm", "-f", oldPath]);
          results.push(`Deleted ${oldPath}`);
        } else {
          const fullPath = path.join(this.project.projectDir, oldPath);
          let content = "";
          try {
            content = await fsReadFile(fullPath, "utf-8");
          } catch {
            return `Error: cannot read ${oldPath}`;
          }
          let fileLines = content.split("\n");
          for (const hunk of hunks) {
            fileLines = this.applyHunk(
              fileLines,
              hunk.oldStart,
              hunk.oldLines,
              hunk.newLines,
            );
          }
          await this.project.writeFile(oldPath, fileLines.join("\n"));
          results.push(`Patched ${oldPath}`);
        }
      } else {
        i++;
      }
    }
    return results.length > 0 ? results.join("\n") : "No patches applied";
  }

  private applyHunk(
    fileLines: string[],
    oldStart: number,
    oldLines: string[],
    newLines: string[],
  ): string[] {
    const startIdx = oldStart - 1;
    const endIdx = startIdx + oldLines.length;
    const before = fileLines.slice(0, startIdx);
    const after = fileLines.slice(endIdx);
    return [...before, ...newLines, ...after];
  }

  // ── memory_recall ────────────────────────────────────────

  private async memoryRecall(a: Record<string, unknown>): Promise<string> {
    if (!this.memory) return "Error: memory manager not available";
    const query = String(a.query).toLowerCase();
    const facts = await this.memory.project.getFacts();
    const failures = await this.memory.project.getFailures();
    const matchedFacts: string[] = [];
    for (const [key, value] of Object.entries(facts)) {
      if (
        key.toLowerCase().includes(query) ||
        JSON.stringify(value).toLowerCase().includes(query)
      ) {
        matchedFacts.push(`fact[${key}]: ${JSON.stringify(value)}`);
      }
    }
    const matchedFailures: string[] = [];
    for (const f of failures) {
      const fStr = JSON.stringify(f).toLowerCase();
      if (fStr.includes(query)) {
        matchedFailures.push(`failure: ${JSON.stringify(f).slice(0, 300)}`);
      }
    }
    const parts: string[] = [];
    if (matchedFacts.length > 0)
      parts.push("Matching facts:\n" + matchedFacts.join("\n"));
    if (matchedFailures.length > 0)
      parts.push("Matching failures:\n" + matchedFailures.join("\n"));
    return parts.length > 0 ? parts.join("\n\n") : "No matching memories found";
  }

  // ── memory_retain ─────────────────────────────────────────

  private async memoryRetain(a: Record<string, unknown>): Promise<string> {
    if (!this.memory) return "Error: memory manager not available";
    const key = String(a.key);
    const value = String(a.value);
    await this.memory.project.addFact(key, value);
    return `Stored fact: ${key} = ${value}`;
  }

  // ── code_review ──────────────────────────────────────────

  private async codeReview(a: Record<string, unknown>): Promise<string> {
    const relPath = String(a.path);
    const focus = a.focus !== undefined ? String(a.focus) : "";
    const fullPath = path.join(this.project.projectDir, relPath);
    if (!existsSync(fullPath)) {
      return `Error: path not found: ${relPath}`;
    }
    const { stat } = await import("node:fs/promises");
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      const files = await this.project.glob("**/*.{ts,js,tsx,jsx}", relPath);
      const reviews: string[] = [];
      for (const f of files.slice(0, 10)) {
        reviews.push(await this.reviewSingleFile(f, focus));
      }
      return `Code review for ${relPath}/\n${reviews.join("\n\n")}`;
    }
    return await this.reviewSingleFile(relPath, focus);
  }

  private async reviewSingleFile(relPath: string, focus: string): Promise<string> {
    const content = await this.project.readFile(relPath);
    const lines = content.split("\n");
    const findings: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const lineNum = i + 1;
      if (/\bany\b/.test(line) && !line.includes("// eslint-disable")) {
        findings.push(`P2:${relPath}:${lineNum}: 'any' type usage`);
      }
      if (/console\.(log|debug|info)\(/.test(line) && !line.includes("// debug")) {
        findings.push(`P3:${relPath}:${lineNum}: console.log left in code`);
      }
      if (/TODO|FIXME|HACK|XXX/.test(line)) {
        const marker = line.match(/TODO|FIXME|HACK|XXX/)![0];
        findings.push(`P3:${relPath}:${lineNum}: ${marker} comment`);
      }
      if (/eval\(/.test(line)) {
        findings.push(`P0:${relPath}:${lineNum}: eval() usage - security risk`);
      }
      if (/\bexec\b.*\bnew RegExp\(/.test(line)) {
        findings.push(
          `P1:${relPath}:${lineNum}: dynamic RegExp with exec - possible ReDoS`,
        );
      }
    }
    const header = `Code review: ${relPath}${focus ? ` (focus: ${focus})` : ""}`;
    if (findings.length === 0) return `${header}\nNo issues found.`;
    const p0 = findings.filter((f) => f.startsWith("P0:"));
    const p1 = findings.filter((f) => f.startsWith("P1:"));
    const p2 = findings.filter((f) => f.startsWith("P2:"));
    const p3 = findings.filter((f) => f.startsWith("P3:"));
    const sections: string[] = [header];
    if (p0.length)
      sections.push("P0 (Critical):\n" + p0.map((f) => f.slice(3)).join("\n"));
    if (p1.length)
      sections.push("P1 (High):\n" + p1.map((f) => f.slice(3)).join("\n"));
    if (p2.length)
      sections.push("P2 (Medium):\n" + p2.map((f) => f.slice(3)).join("\n"));
    if (p3.length)
      sections.push("P3 (Low):\n" + p3.map((f) => f.slice(3)).join("\n"));
    return sections.join("\n\n");
  }

  // ── find_skills ───────────────────────────────────────────

  private async findSkills(a: Record<string, unknown>): Promise<string> {
    const skillsDir = this._config.skillsDir;
    if (!existsSync(skillsDir)) return "No skills directory found";
    const { readdir } = await import("node:fs/promises");
    const query = a.query !== undefined ? String(a.query).toLowerCase() : "";
    const entries = await readdir(skillsDir, { withFileTypes: true });
    const skills: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMd = path.join(skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillMd)) continue;
      if (query) {
        const content = await fsReadFile(skillMd, "utf-8");
        if (
          !entry.name.toLowerCase().includes(query) &&
          !content.toLowerCase().includes(query)
        ) {
          continue;
        }
        const descMatch = content.match(/^#\s+(.+)$/m);
        const desc = descMatch ? descMatch[1]! : entry.name;
        skills.push(`${entry.name}: ${desc}`);
      } else {
        let desc = entry.name;
        try {
          const content = await fsReadFile(skillMd, "utf-8");
          const descMatch = content.match(/^#\s+(.+)$/m);
          if (descMatch) desc = descMatch[1]!;
        } catch {
          /* use name */
        }
        skills.push(`${entry.name}: ${desc}`);
      }
    }
    return skills.length > 0 ? skills.join("\n") : "No skills found";
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