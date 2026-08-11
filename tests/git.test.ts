import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { GitManager } from "../src/managers/git.js";
import { ProjectManager } from "../src/managers/project.js";
import { execSync } from "node:child_process";

let tmpDir: string;
let config: Config;

async function setup(gitInit = false): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-git-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir, projectDir: tmpDir });
  config.setProjectDir(tmpDir);
  if (gitInit) {
    execSync("git init", { cwd: tmpDir });
    execSync('git config user.email "test@test.com"', { cwd: tmpDir });
    execSync('git config user.name "Test"', { cwd: tmpDir });
  }
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("GitManager", () => {
  beforeEach(async () => await setup(true));
  afterEach(cleanup);

  it("isRepo returns true in git repo", async () => {
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    expect(await gm.isRepo()).toBe(true);
  });

  it("status returns output", async () => {
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    await writeFile(path.join(tmpDir, "test.txt"), "hello");
    const status = await gm.status();
    expect(status).toContain("test.txt");
  });

  it("add stages files", async () => {
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    await writeFile(path.join(tmpDir, "a.txt"), "content");
    await gm.add(["a.txt"]);
    const diff = await gm.diff(true);
    expect(diff).toContain("a.txt");
  });

  it("commit creates commit", async () => {
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    await writeFile(path.join(tmpDir, "b.txt"), "content");
    await gm.add(["b.txt"]);
    const result = await gm.commit("test commit");
    expect(result).toMatch(/test commit|master|main/);
  });

  it("log shows commits", async () => {
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    await writeFile(path.join(tmpDir, "d.txt"), "content");
    await gm.add(["d.txt"]);
    await gm.commit("commit msg");
    const log = await gm.log(5);
    expect(log).toContain("commit msg");
  });

  it("isRepo returns false outside git", async () => {
    await setup(false);
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    expect(await gm.isRepo()).toBe(false);
  });

  it("branch create", async () => {
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    const result = await gm.branch("create", "dev");
    expect(result).not.toContain("Error");
  });

  it("branch unknown action returns error", async () => {
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    const result = await gm.branch("invalid" as "list", "x");
    expect(result).toContain("Error");
  });

  it("diff unstaged", async () => {
    const pm = new ProjectManager(config);
    const gm = new GitManager(pm);
    await writeFile(path.join(tmpDir, "e.txt"), "content");
    execSync("git add e.txt", { cwd: tmpDir });
    execSync('git commit -m "initial"', { cwd: tmpDir });
    await writeFile(path.join(tmpDir, "e.txt"), "modified");
    const diff = await gm.diff(false);
    expect(diff).toContain("modified");
  });
});