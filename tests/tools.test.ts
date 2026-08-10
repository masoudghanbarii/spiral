import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { ProjectManager } from "../src/managers/project.js";
import { PermissionManager } from "../src/managers/permissions.js";
import { ToolRegistry } from "../src/tools/registry.js";

let tmpDir: string;
let config: Config;
let pm: ProjectManager;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-tools-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir, projectDir: tmpDir, autoApprove: true });
  config.setProjectDir(tmpDir);
  await mkdir(path.join(tmpDir, "docs", "adr"), { recursive: true });
  await writeFile(config.adrPath, "# ADR\n## Section 1\ncontent\n", "utf-8");
  await writeFile(config.agentsPath, "# Agents", "utf-8");
  pm = new ProjectManager(config);
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("ToolRegistry", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("unknown tool returns error", async () => {
    const perm = new PermissionManager(config);
    const tools = new ToolRegistry(config, pm, perm);
    const result = await tools.execute("unknown_tool", {});
    expect(result).toContain("unknown tool");
  });

  it("write_file + read_file", async () => {
    const perm = new PermissionManager(config);
    perm.autoApprove = true;
    const tools = new ToolRegistry(config, pm, perm);
    await tools.execute("write_file", { path: "test.txt", content: "hello" });
    const result = await tools.execute("read_file", { path: "test.txt" });
    expect(result).toBe("hello");
  });

  it("edit_file", async () => {
    const perm = new PermissionManager(config);
    perm.autoApprove = true;
    const tools = new ToolRegistry(config, pm, perm);
    await tools.execute("write_file", { path: "t.py", content: "hello" });
    const result = await tools.execute("edit_file", {
      path: "t.py",
      old_string: "hello",
      new_string: "world",
    });
    expect(result).toContain("Replaced");
  });

  it("plan mode blocks write_file", async () => {
    const perm = new PermissionManager(config);
    const tools = new ToolRegistry(config, pm, perm, "plan");
    const result = await tools.execute("write_file", { path: "x.txt", content: "x" });
    expect(result).toContain("disabled");
  });

  it("plan mode allows read_file", async () => {
    const perm = new PermissionManager(config);
    const tools = new ToolRegistry(config, pm, perm, "plan");
    await pm.writeFile("t.txt", "content");
    const result = await tools.execute("read_file", { path: "t.txt" });
    expect(result).toBe("content");
  });

  it("safe mode blocks run_tests", async () => {
    const perm = new PermissionManager(config);
    const tools = new ToolRegistry(config, pm, perm, "safe");
    const result = await tools.execute("run_tests", {});
    expect(result).toContain("disabled");
  });

  it("bypass mode skips permission checks", async () => {
    const perm = new PermissionManager(config);
    perm.autoApprove = false;
    const tools = new ToolRegistry(config, pm, perm, "bypass");
    const result = await tools.execute("run_command", { command: "echo hi" });
    expect(result).not.toContain("Approval required");
  });

  it("getToolDefinitions returns all tools", async () => {
    const perm = new PermissionManager(config);
    const tools = new ToolRegistry(config, pm, perm);
    const defs = tools.getToolDefinitions();
    expect(defs.length).toBeGreaterThanOrEqual(15);
    const names = defs.map((d) => d.function.name);
    expect(names).toContain("read_file");
    expect(names).toContain("edit_file");
    expect(names).toContain("grep");
    expect(names).toContain("git_status");
  });
});

describe("PermissionManager", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("auto-approve non-destructive", () => {
    const perm = new PermissionManager(config);
    expect(perm.check("read_file", {})).toBe("auto");
  });

  it("deny rm -rf", () => {
    const perm = new PermissionManager(config);
    expect(perm.check("run_command", { command: "rm -rf /" })).toBe("deny");
  });

  it("deny git push --force", () => {
    const perm = new PermissionManager(config);
    expect(perm.check("run_command", { command: "git push --force" })).toBe("deny");
  });

  it("auto-approve when enabled", () => {
    config.autoApprove = true;
    const perm = new PermissionManager(config);
    expect(perm.check("write_file", { path: "x", content: "y" })).toBe("auto");
  });

  it("shouldExecute denies dangerous", async () => {
    const perm = new PermissionManager(config);
    const [ok, reason] = await perm.shouldExecute("run_command", { command: "rm -rf /" });
    expect(ok).toBe(false);
    expect(reason).toContain("Denied");
  });
});
