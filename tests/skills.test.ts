import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { SkillManager } from "../src/skills/index.js";

let tmpDir: string;
let skillsDir: string;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-skill-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  skillsDir = path.join(tmpDir, "skills");
  await mkdir(skillsDir, { recursive: true });
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("SkillManager", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("discover returns empty when no skills dir", async () => {
    const sm = new SkillManager("/nonexistent");
    await sm.discover();
    expect(sm.list()).toEqual([]);
  });

  it("discover finds SKILL.md files", async () => {
    const skillDir = path.join(skillsDir, "my-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(path.join(skillDir, "SKILL.md"), "# My Skill\nDescription here\n", "utf-8");

    const sm = new SkillManager(skillsDir);
    await sm.discover();
    expect(sm.list()).toHaveLength(1);
    expect(sm.list()[0]!.name).toBe("my-skill");
  });

  it("discover extracts description from first heading", async () => {
    const skillDir = path.join(skillsDir, "test-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(path.join(skillDir, "SKILL.md"), "# Test Skill Title\ncontent\n", "utf-8");

    const sm = new SkillManager(skillsDir);
    await sm.discover();
    expect(sm.list()[0]!.description).toBe("Test Skill Title");
  });

  it("discover skips dirs without SKILL.md", async () => {
    const emptyDir = path.join(skillsDir, "empty");
    await mkdir(emptyDir, { recursive: true });

    const sm = new SkillManager(skillsDir);
    await sm.discover();
    expect(sm.list()).toEqual([]);
  });

  it("get returns skill by name", async () => {
    const skillDir = path.join(skillsDir, "found");
    await mkdir(skillDir, { recursive: true });
    await writeFile(path.join(skillDir, "SKILL.md"), "# Found\n", "utf-8");

    const sm = new SkillManager(skillsDir);
    await sm.discover();
    expect(sm.get("found")).not.toBeUndefined();
    expect(sm.get("notfound")).toBeUndefined();
  });

  it("load returns skill content", async () => {
    const skillDir = path.join(skillsDir, "content-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(path.join(skillDir, "SKILL.md"), "# Content\nbody text\n", "utf-8");

    const sm = new SkillManager(skillsDir);
    await sm.discover();
    const content = await sm.load("content-skill");
    expect(content).toContain("body text");
  });

  it("load returns error for unknown skill", async () => {
    const sm = new SkillManager(skillsDir);
    await sm.discover();
    const result = await sm.load("unknown");
    expect(result).toContain("not found");
  });

  it("search finds by name", async () => {
    const skillDir = path.join(skillsDir, "searchable");
    await mkdir(skillDir, { recursive: true });
    await writeFile(path.join(skillDir, "SKILL.md"), "# Searchable Skill\n", "utf-8");

    const sm = new SkillManager(skillsDir);
    await sm.discover();
    const results = sm.search("search");
    expect(results).toHaveLength(1);
  });

  it("search returns empty for no match", async () => {
    const sm = new SkillManager(skillsDir);
    await sm.discover();
    expect(sm.search("nonexistent")).toEqual([]);
  });

  it("discover finds multiple skills", async () => {
    for (const name of ["a", "b", "c"]) {
      const d = path.join(skillsDir, name);
      await mkdir(d, { recursive: true });
      await writeFile(path.join(d, "SKILL.md"), `# ${name}\n`, "utf-8");
    }

    const sm = new SkillManager(skillsDir);
    await sm.discover();
    expect(sm.list()).toHaveLength(3);
  });
});
