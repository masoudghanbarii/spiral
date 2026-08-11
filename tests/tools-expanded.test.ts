import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { ProjectManager } from "../src/managers/project.js";
import { PermissionManager } from "../src/managers/permissions.js";
import { MemoryManager } from "../src/managers/memory.js";
import { ToolRegistry } from "../src/tools/registry.js";

let tmpDir: string;
let config: Config;
let pm: ProjectManager;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-toolsx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir, projectDir: tmpDir, autoApprove: true });
  config.setProjectDir(tmpDir);
  config.memoryDir = path.join(tmpDir, "memory");
  config.skillsDir = path.join(tmpDir, "skills");
  await mkdir(path.join(tmpDir, "docs", "adr"), { recursive: true });
  await writeFile(config.adrPath, "# ADR\n## Section 1\ncontent\n", "utf-8");
  await writeFile(config.agentsPath, "# Agents", "utf-8");
  pm = new ProjectManager(config);
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

function makeTools(memory?: MemoryManager, mode = "normal"): ToolRegistry {
  const perm = new PermissionManager(config);
  perm.autoApprove = true;
  return new ToolRegistry(config, pm, perm, mode, memory);
}

describe("ToolRegistry (expanded)", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("run_command executes shell", async () => {
    const tools = makeTools();
    const result = await tools.execute("run_command", { command: "echo hello" });
    expect(result).toContain("hello");
  });

  it("run_tests runs npm test", async () => {
    await writeFile(path.join(tmpDir, "package.json"), "{}", "utf-8");
    const tools = makeTools();
    const result = await tools.execute("run_tests", {});
    expect(typeof result).toBe("string");
  });

  it("run_lint resolves package.json lint cmd", async () => {
    await writeFile(path.join(tmpDir, "package.json"), "{}", "utf-8");
    const tools = makeTools();
    const result = await tools.execute("run_lint", {});
    expect(typeof result).toBe("string");
  });

  it("list_files lists ts files", async () => {
    await pm.writeFile("a.ts", "x");
    const tools = makeTools();
    const result = await tools.execute("list_files", {});
    expect(result).toContain("a.ts");
  });

  it("grep returns matches", async () => {
    await pm.writeFile("x.txt", "hello world");
    const tools = makeTools();
    const result = await tools.execute("grep", { pattern: "hello" });
    expect(result).toContain("x.txt");
  });

  it("grep returns no matches message", async () => {
    await pm.writeFile("x.txt", "no match here");
    const tools = makeTools();
    const result = await tools.execute("grep", { pattern: "zzz" });
    expect(result).toContain("No matches found");
  });

  it("glob finds files", async () => {
    await pm.writeFile("b.ts", "x");
    const tools = makeTools();
    const result = await tools.execute("glob", { pattern: "**/*.ts" });
    expect(result).toContain("b.ts");
  });

  it("glob returns no files found", async () => {
    const tools = makeTools();
    const result = await tools.execute("glob", { pattern: "**/*.xyz" });
    expect(result).toContain("No files found");
  });

  it("read_adr returns content", async () => {
    const tools = makeTools();
    const result = await tools.execute("read_adr", {});
    expect(result).toContain("Section 1");
  });

  it("mark_adr_done updates status", async () => {
    const tools = makeTools();
    const result = await tools.execute("mark_adr_done", { section: "Section 1" });
    expect(result).toContain("Done");
  });

  it("read_agents_md returns content", async () => {
    const tools = makeTools();
    const result = await tools.execute("read_agents_md", {});
    expect(result).toContain("# Agents");
  });

  it("git_status returns output", async () => {
    await pm.writeFile("c.txt", "x");
    const tools = makeTools();
    const result = await tools.execute("git_status", {});
    expect(typeof result).toBe("string");
  });

  it("git_diff default staged", async () => {
    await pm.writeFile("d.txt", "x");
    const tools = makeTools();
    const result = await tools.execute("git_diff", {});
    expect(typeof result).toBe("string");
  });

  it("git_add stages files", async () => {
    await pm.writeFile("e.txt", "x");
    const tools = makeTools();
    const result = await tools.execute("git_add", { paths: ["e.txt"] });
    expect(typeof result).toBe("string");
  });

  it("git_branch lists", async () => {
    const tools = makeTools();
    const result = await tools.execute("git_branch", {});
    expect(typeof result).toBe("string");
  });

  it("git_log shows output", async () => {
    const tools = makeTools();
    const result = await tools.execute("git_log", { limit: 5 });
    expect(typeof result).toBe("string");
  });
});

describe("ToolRegistry todo", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("add + list todos", async () => {
    const tools = makeTools();
    await tools.execute("todo", { action: "add", task: "do thing", priority: "high" });
    const list = await tools.execute("todo", { action: "list" });
    expect(list).toContain("do thing");
    expect(list).toContain("high");
  });

  it("add todo requires task", async () => {
    const tools = makeTools();
    const result = await tools.execute("todo", { action: "add" });
    expect(result).toContain("task is required");
  });

  it("update todo", async () => {
    const tools = makeTools();
    await tools.execute("todo", { action: "add", task: "a" });
    const result = await tools.execute("todo", {
      action: "update",
      task: "1",
      status: "completed",
    });
    expect(result).toContain("completed");
  });

  it("update missing todo", async () => {
    const tools = makeTools();
    const result = await tools.execute("todo", { action: "update", task: "99" });
    expect(result).toContain("not found");
  });

  it("remove todo", async () => {
    const tools = makeTools();
    await tools.execute("todo", { action: "add", task: "a" });
    const result = await tools.execute("todo", { action: "remove", task: "1" });
    expect(result).toContain("Removed");
  });

  it("remove missing todo", async () => {
    const tools = makeTools();
    const result = await tools.execute("todo", { action: "remove", task: "9" });
    expect(result).toContain("not found");
  });

  it("unknown todo action", async () => {
    const tools = makeTools();
    const result = await tools.execute("todo", { action: "bogus" });
    expect(result).toContain("unknown todo action");
  });

  it("list empty todos", async () => {
    const tools = makeTools();
    const result = await tools.execute("todo", { action: "list" });
    expect(result).toContain("No todos");
  });
});

describe("ToolRegistry question", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("returns question text", async () => {
    const tools = makeTools();
    const result = await tools.execute("question", { question: "Proceed?" });
    expect(result).toContain("Proceed?");
  });

  it("includes options", async () => {
    const tools = makeTools();
    const result = await tools.execute("question", {
      question: "Pick?",
      options: ["yes", "no"],
    });
    expect(result).toContain("yes");
    expect(result).toContain("no");
  });
});

describe("ToolRegistry apply_patch", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("patches existing file", async () => {
    await pm.writeFile("target.txt", "line1\nline2\nline3\n");
    const tools = makeTools();
    const patch = [
      "--- a/target.txt",
      "+++ b/target.txt",
      "@@ -1,3 +1,3 @@",
      " line1",
      "-line2",
      "+line2-new",
      " line3",
    ].join("\n");
    const result = await tools.execute("apply_patch", { patch });
    expect(result).toContain("Patched");
    const content = await pm.readFile("target.txt");
    expect(content).toContain("line2-new");
  });

  it("creates new file from /dev/null", async () => {
    const tools = makeTools();
    const patch = [
      "--- /dev/null",
      "+++ b/newfile.txt",
      "@@ -0,0 +1,1 @@",
      "+brand new",
    ].join("\n");
    const result = await tools.execute("apply_patch", { patch });
    expect(result).toContain("Created");
    const content = await pm.readFile("newfile.txt");
    expect(content).toContain("brand new");
  });

  it("deletes file to /dev/null", async () => {
    await pm.writeFile("gone.txt", "x");
    const tools = makeTools();
    const patch = [
      "--- a/gone.txt",
      "+++ /dev/null",
      "@@ -1 +0,0 @@",
      "-x",
    ].join("\n");
    const result = await tools.execute("apply_patch", { patch });
    expect(result).toContain("Deleted");
  });

  it("no patches applied", async () => {
    const tools = makeTools();
    const result = await tools.execute("apply_patch", { patch: "some random text" });
    expect(result).toContain("No patches applied");
  });
});

describe("ToolRegistry memory", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("memory_retain stores fact and recall finds it", async () => {
    const memory = new MemoryManager(config);
    const tools = makeTools(memory);
    await tools.execute("memory_retain", { key: "lang", value: "ts" });
    const result = await tools.execute("memory_recall", { query: "lang" });
    expect(result).toContain("lang");
  });

  it("memory_recall no matches", async () => {
    const memory = new MemoryManager(config);
    const tools = makeTools(memory);
    const result = await tools.execute("memory_recall", { query: "nothing" });
    expect(result).toContain("No matching memories");
  });

  it("memory_recall without manager", async () => {
    const tools = makeTools();
    const result = await tools.execute("memory_recall", { query: "x" });
    expect(result).toContain("not available");
  });

  it("memory_retain without manager", async () => {
    const tools = makeTools();
    const result = await tools.execute("memory_retain", { key: "a", value: "b" });
    expect(result).toContain("not available");
  });
});

describe("ToolRegistry code_review", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("reviews file with findings", async () => {
    await pm.writeFile("bad.ts", 'const x: any = 1;\nconsole.log("hi");\n// TODO fix\n');
    const tools = makeTools();
    const result = await tools.execute("code_review", { path: "bad.ts" });
    expect(result).toContain("Code review");
  });

  it("reviews directory", async () => {
    await pm.writeFile("src/app.ts", "export const a = 1;\n");
    const tools = makeTools();
    const result = await tools.execute("code_review", { path: "src" });
    expect(result).toContain("Code review");
  });

  it("missing path error", async () => {
    const tools = makeTools();
    const result = await tools.execute("code_review", { path: "nope.ts" });
    expect(result).toContain("not found");
  });

  it("no issues found", async () => {
    await pm.writeFile("clean.ts", "export const a = 1;\n");
    const tools = makeTools();
    const result = await tools.execute("code_review", { path: "clean.ts" });
    expect(result).toContain("No issues found");
  });
});

describe("ToolRegistry find_skills", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("no skills dir", async () => {
    const tools = makeTools();
    const result = await tools.execute("find_skills", {});
    expect(result).toContain("No skills directory");
  });

  it("lists skills", async () => {
    await mkdir(path.join(config.skillsDir, "tdd"), { recursive: true });
    await writeFile(path.join(config.skillsDir, "tdd", "SKILL.md"), "# TDD Skill\nbody", "utf-8");
    const tools = makeTools();
    const result = await tools.execute("find_skills", {});
    expect(result).toContain("tdd");
  });

  it("filters by query", async () => {
    await mkdir(path.join(config.skillsDir, "tdd"), { recursive: true });
    await writeFile(path.join(config.skillsDir, "tdd", "SKILL.md"), "# TDD Skill\nbody", "utf-8");
    await mkdir(path.join(config.skillsDir, "ops"), { recursive: true });
    await writeFile(path.join(config.skillsDir, "ops", "SKILL.md"), "# Ops\n", "utf-8");
    const tools = makeTools();
    const result = await tools.execute("find_skills", { query: "tdd" });
    expect(result).toContain("tdd");
    expect(result).not.toContain("ops");
  });

  it("no matching skills", async () => {
    await mkdir(path.join(config.skillsDir, "tdd"), { recursive: true });
    await writeFile(path.join(config.skillsDir, "tdd", "SKILL.md"), "# TDD\n", "utf-8");
    const tools = makeTools();
    const result = await tools.execute("find_skills", { query: "zzz" });
    expect(result).toContain("No skills found");
  });
});

describe("ToolRegistry webfetch/websearch", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("webfetch returns markdown for html", async () => {
    const resp = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { get: () => "text/html" },
      text: async () => "<html><body><h1>Title</h1><p>Hello</p></body></html>",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resp));
    const tools = makeTools();
    const result = await tools.execute("webfetch", { url: "https://example.com" });
    expect(result).toContain("Hello");
    vi.unstubAllGlobals();
  });

  it("webfetch returns error on non-ok", async () => {
    const resp = { ok: false, status: 404, statusText: "Not Found" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resp));
    const tools = makeTools();
    const result = await tools.execute("webfetch", { url: "https://example.com" });
    expect(result).toContain("404");
    vi.unstubAllGlobals();
  });

  it("websearch uses exa when key present", async () => {
    const resp = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { get: () => "application/json" },
      json: async () => ({
        results: [{ title: "Result 1", url: "https://x", text: "snippet" }],
      }),
      text: async () => "",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resp));
    vi.stubEnv("EXA_API_KEY", "test-key");
    const tools = makeTools();
    const result = await tools.execute("websearch", { query: "cats", max_results: 2 });
    expect(result).toContain("Result 1");
    vi.unstubAllGlobals();
  });

  it("websearch falls back to duckduckgo without exa key", async () => {
    const resp = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { get: () => "text/html" },
      text: async () =>
        '<a class="result__a" href="/d?q=x">Title One</a><a class="result__snippet">Snippet One</a>',
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resp));
    vi.stubEnv("EXA_API_KEY", "");
    const tools = makeTools();
    const result = await tools.execute("websearch", { query: "cats" });
    expect(result).toContain("Title One");
    vi.unstubAllGlobals();
  });
});
