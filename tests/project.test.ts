import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Config } from "../src/config.js";
import { ProjectManager } from "../src/managers/project.js";

async function makeConfig(tmpDir: string): Promise<Config> {
  const c = new Config({ projectDir: tmpDir, spiralDir: tmpDir });
  c.setProjectDir(tmpDir);
  await mkdir(path.join(tmpDir, "docs", "adr"), { recursive: true });
  await writeFile(c.adrPath, "# ADR\n## Section 1\ncontent\n", "utf-8");
  await writeFile(c.agentsPath, "# Agents", "utf-8");
  return c;
}

describe("ProjectManager", async () => {
  let tmpDir: string;
  let config: Config;
  let pm: ProjectManager;

  beforeEach(async () => {
    tmpDir = path.join("/tmp", `spiral-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    config = await makeConfig(tmpDir);
    pm = new ProjectManager(config);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("reads ADR", async () => {
    const adr = await pm.readAdr();
    expect(adr).toContain("Section 1");
  });

  it("reads AGENTS.md", async () => {
    const agents = await pm.readAgentsMd();
    expect(agents).toBe("# Agents");
  });

  it("writes and reads file", async () => {
    await pm.writeFile("test.txt", "hello");
    const content = await pm.readFile("test.txt");
    expect(content).toBe("hello");
  });

  it("readFile with offset/limit", async () => {
    await pm.writeFile("test.txt", "line1\nline2\nline3\nline4\n");
    const content = await pm.readFile("test.txt", 2, 2);
    expect(content).toContain("2: line2");
    expect(content).toContain("3: line3");
    expect(content).not.toContain("line1");
  });

  it("editFile replaces single occurrence", async () => {
    await pm.writeFile("test.txt", "def foo():\n    return 1\n");
    const result = await pm.editFile("test.txt", "return 1", "return 2");
    expect(result).toContain("1 occurrence");
    const content = await pm.readFile("test.txt");
    expect(content).toContain("return 2");
  });

  it("editFile errors on not found", async () => {
    await pm.writeFile("test.txt", "content");
    await expect(pm.editFile("test.txt", "nonexistent", "x")).rejects.toThrow("not found");
  });

  it("editFile errors on multiple without replaceAll", async () => {
    await pm.writeFile("test.txt", "a\na\na\n");
    await expect(pm.editFile("test.txt", "a", "b")).rejects.toThrow("3 times");
  });

  it("editFile replaceAll", async () => {
    await pm.writeFile("test.txt", "a\na\na\n");
    const result = await pm.editFile("test.txt", "a", "b", true);
    expect(result).toContain("3 occurrence");
  });

  it("markAdrDone updates status", async () => {
    await pm.markAdrDone("Section 1");
    const adr = await pm.readAdr();
    expect(adr).toContain("**Status:** Done");
  });

  it("getAdrSectionNames", async () => {
    await writeFile(config.adrPath, "# ADR\n## A\n## B\n## C\n", "utf-8");
    const sections = await pm.getAdrSectionNames();
    expect(sections).toEqual(["A", "B", "C"]);
  });

  it("grep finds matches", async () => {
    await pm.writeFile("a.ts", "function foo() {}\n");
    await pm.writeFile("b.ts", "function bar() {}\n");
    const matches = await pm.grep("function (\\w+)");
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("glob finds files", async () => {
    await pm.writeFile("src/a.ts", "");
    await pm.writeFile("src/b.ts", "");
    const files = await pm.glob("**/*.ts");
    expect(files.some((f) => f.includes("a.ts"))).toBe(true);
  });
});
