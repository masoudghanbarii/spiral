import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { Config } from "../config.js";
import type { GrepMatch } from "../types.js";

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function safeReadFile(p: string): Promise<string> {
  try {
    return await readFile(p, "utf-8");
  } catch {
    return "";
  }
}

export class ProjectManager {
  config: Config;
  projectDir: string;

  constructor(config: Config) {
    this.config = config;
    this.projectDir = config.projectDir;
  }

  async readAdr(): Promise<string> {
    return readFile(this.config.adrPath, "utf-8");
  }

  async readAgentsMd(): Promise<string> {
    return readFile(this.config.agentsPath, "utf-8");
  }

  async updateAdr(section: string, status: string): Promise<void> {
    const adr = await this.readAdr();
    const marker = `## ${section}`;
    if (!adr.includes(marker)) return;
    const lines = adr.split("\n");
    const newLines: string[] = [];
    let found = false;
    let statusUpdated = false;
    for (const line of lines) {
      if (line.trim().startsWith(marker)) found = true;
      if (found && line.trim().startsWith("**Status:**")) {
        newLines.push(`**Status:** ${status}`);
        found = false;
        statusUpdated = true;
      } else {
        newLines.push(line);
      }
    }
    if (!statusUpdated) {
      for (let i = 0; i < newLines.length; i++) {
        if (newLines[i].trim().startsWith(marker)) {
          newLines.splice(i + 1, 0, `**Status:** ${status}`);
          break;
        }
      }
    }
    await writeFile(this.config.adrPath, newLines.join("\n"), "utf-8");
  }

  async markAdrDone(section: string): Promise<void> {
    await this.updateAdr(section, "Done");
  }

  async appendAdrSection(title: string, description: string): Promise<void> {
    const adr = await this.readAdr();
    const newSection = `\n\n## ${title}\n\n${description}\n\n**Status:** Pending\n`;
    await writeFile(this.config.adrPath, adr + newSection, "utf-8");
  }

  async getAdrSectionNames(): Promise<string[]> {
    const adr = await this.readAdr();
    const sections: string[] = [];
    for (const line of adr.split("\n")) {
      const stripped = line.trim();
      if (stripped.startsWith("## ")) sections.push(stripped.slice(3).trim());
    }
    return sections;
  }

  async fileExists(relPath: string): Promise<boolean> {
    return fileExists(path.join(this.projectDir, relPath));
  }

  async readFile(relPath: string, offset?: number, limit?: number): Promise<string> {
    const f = path.join(this.projectDir, relPath);
    if (!(await fileExists(f))) return "";
    if (offset === undefined && limit === undefined) {
      return safeReadFile(f);
    }
    const content = await safeReadFile(f);
    const lines = content.split("\n");
    const start = Math.max(0, (offset ?? 1) - 1);
    const end = limit ? start + limit : lines.length;
    const selected = lines.slice(start, end);
    return selected.map((line, i) => `${start + i + 1}: ${line}`).join("\n");
  }

  async writeFile(relPath: string, content: string): Promise<void> {
    const f = path.join(this.projectDir, relPath);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, content, "utf-8");
  }

  async editFile(
    relPath: string,
    oldString: string,
    newString: string,
    replaceAll = false,
  ): Promise<string> {
    const f = path.join(this.projectDir, relPath);
    if (!(await fileExists(f))) throw new Error(`File not found: ${relPath}`);
    const content = await safeReadFile(f);
    const count = content.split(oldString).length - 1;
    if (count === 0) throw new Error(`old_string not found in ${relPath}`);
    if (count > 1 && !replaceAll)
      throw new Error(
        `old_string found ${count} times in ${relPath}; use replaceAll=true or provide more context`,
      );
    const newContent = replaceAll
      ? content.split(oldString).join(newString)
      : content.replace(oldString, newString);
    await writeFile(f, newContent, "utf-8");
    return `Replaced ${replaceAll ? count : 1} occurrence(s) in ${relPath}`;
  }

  async glob(pattern: string, subdir?: string): Promise<string[]> {
    const base = subdir ? path.join(this.projectDir, subdir) : this.projectDir;
    return globImpl(base, pattern, this.projectDir);
  }

  async grep(
    pattern: string,
    opts: { include?: string; subdir?: string; maxResults?: number } = {},
  ): Promise<GrepMatch[]> {
    const base = opts.subdir ? path.join(this.projectDir, opts.subdir) : this.projectDir;
    const include = opts.include ?? "*";
    const max = opts.maxResults ?? 100;
    return grepImpl(base, pattern, include, max, this.projectDir);
  }

  runCommand(
    cmd: string[],
    cwd?: string,
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      const proc = spawn(cmd[0]!, cmd.slice(1), {
        cwd: cwd ?? this.projectDir,
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      proc.stdout?.on("data", (d: Buffer) => (stdout += d.toString()));
      proc.stderr?.on("data", (d: Buffer) => (stderr += d.toString()));
      proc.on("close", (code: number | null) => resolve({ stdout, stderr, code: code ?? 0 }));
      proc.on("error", () => resolve({ stdout, stderr, code: 1 }));
    });
  }

  async listProjectFiles(pattern = "**/*.ts"): Promise<string[]> {
    return this.glob(pattern);
  }

  async getProjectContext(): Promise<Record<string, unknown>> {
    return {
      adr: await this.readAdr(),
      agents_md: await this.readAgentsMd(),
      files: await this.listProjectFiles(),
      project_dir: this.projectDir,
    };
  }
}

async function globImpl(base: string, pattern: string, projectDir: string): Promise<string[]> {
  const { glob } = await import("node:fs/promises");
  try {
    const results: string[] = [];
    for await (const entry of glob(pattern, { cwd: base, withFileTypes: false })) {
      results.push(path.relative(projectDir, path.join(base, entry)));
    }
    return results.sort();
  } catch {
    return [];
  }
}

async function grepImpl(
  base: string,
  pattern: string,
  include: string,
  max: number,
  projectDir: string,
): Promise<GrepMatch[]> {
  const { glob } = await import("node:fs/promises");
  const regex = new RegExp(pattern);
  const results: GrepMatch[] = [];
  try {
    const filePattern = include === "*" ? "**/*" : `**/${include}`;
    for await (const entry of glob(filePattern, { cwd: base, withFileTypes: false })) {
      if (results.length >= max) break;
      const fullPath = path.join(base, entry);
      try {
        const content = await readFile(fullPath, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (results.length >= max) break;
          if (regex.test(lines[i]!)) {
            results.push({
              file: path.relative(projectDir, fullPath),
              line: i + 1,
              content: lines[i]!,
            });
          }
        }
      } catch {
        continue;
      }
    }
  } catch {
    return [];
  }
  return results;
}
