import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface Skill {
  name: string;
  description: string;
  path: string;
  content: string;
}

export class SkillManager {
  private skills: Map<string, Skill> = new Map();
  private skillsDir: string;

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir;
  }

  async discover(): Promise<void> {
    this.skills.clear();
    if (!existsSync(this.skillsDir)) return;

    const entries = await readdir(this.skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMdPath = path.join(this.skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillMdPath)) continue;

      try {
        const content = await readFile(skillMdPath, "utf-8");
        const descMatch = content.match(/^#\s+(.+)$/m);
        const description = descMatch ? descMatch[1]! : entry.name;
        this.skills.set(entry.name, {
          name: entry.name,
          description,
          path: skillMdPath,
          content,
        });
      } catch {
        // skip unreadable skill files
      }
    }
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  async load(name: string): Promise<string> {
    const skill = this.skills.get(name);
    if (!skill) {
      // try loading directly from disk in case discover wasn't called
      const skillMdPath = path.join(this.skillsDir, name, "SKILL.md");
      if (!existsSync(skillMdPath)) {
        return `Error: skill '${name}' not found`;
      }
      return readFile(skillMdPath, "utf-8");
    }
    return skill.content;
  }

  search(query: string): Skill[] {
    const q = query.toLowerCase();
    const results: Skill[] = [];
    for (const skill of this.skills.values()) {
      if (
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q)
      ) {
        results.push(skill);
      }
    }
    return results;
  }
}