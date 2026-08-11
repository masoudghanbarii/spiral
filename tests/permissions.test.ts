import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Config } from "../src/config.js";
import { PermissionManager } from "../src/managers/permissions.js";

let tmpDir: string;
let config: Config;

async function setup(): Promise<void> {
  tmpDir = path.join(
    os.tmpdir(),
    `spiral-perm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(tmpDir, { recursive: true });
  config = new Config({ spiralDir: tmpDir, autoApprove: false });
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true });
}

describe("PermissionManager (expanded)", () => {
  beforeEach(setup);
  afterEach(cleanup);

  it("setRules adds tool rules", () => {
    const pm = new PermissionManager(config);
    pm.setRules({ write_file: "allow", run_command: "ask" });
    expect(pm.check("write_file", {})).toBe("auto");
    expect(pm.check("run_command", {})).toBe("approve");
  });

  it("setRules ignores invalid levels", () => {
    const pm = new PermissionManager(config);
    pm.setRules({ write_file: "invalid" as unknown as string });
    // Falls back to default (destructive → approve)
    expect(pm.check("write_file", {})).toBe("approve");
  });

  it("setRules deny overrides", () => {
    const pm = new PermissionManager(config);
    pm.setRules({ read_file: "deny" });
    expect(pm.check("read_file", {})).toBe("deny");
  });

  it("addPathPattern matches path", () => {
    const pm = new PermissionManager(config);
    pm.addPathPattern("write_file", "src/allow/*", "allow");
    expect(pm.check("write_file", { path: "src/allow/test.ts" })).toBe("auto");
  });

  it("addPathPattern deny", () => {
    const pm = new PermissionManager(config);
    pm.addPathPattern("write_file", "secrets/*", "deny");
    expect(pm.check("write_file", { path: "secrets/key.json" })).toBe("deny");
  });

  it("addPathPattern ask", () => {
    const pm = new PermissionManager(config);
    pm.addPathPattern("write_file", "src/ask/*", "ask");
    expect(pm.check("write_file", { path: "src/ask/file.ts" })).toBe("approve");
  });

  it("addPathPattern wildcard tool matches", () => {
    const pm = new PermissionManager(config);
    pm.addPathPattern("*", "safe/*", "allow");
    expect(pm.check("write_file", { path: "safe/test.ts" })).toBe("auto");
  });

  it("addApproved pattern", () => {
    const pm = new PermissionManager(config);
    pm.addApproved("echo .*");
    expect(pm.check("run_command", { command: "echo hello" })).toBe("auto");
  });

  it("addApproved exact match", () => {
    const pm = new PermissionManager(config);
    pm.addApproved("ls -la");
    expect(pm.check("run_command", { command: "ls -la" })).toBe("auto");
  });

  it("addApproved for file path", () => {
    const pm = new PermissionManager(config);
    pm.addApproved("src/safe/*");
    expect(pm.check("write_file", { path: "src/safe/test.ts" })).toBe("auto");
  });

  it("hooks run before and after", async () => {
    const pm = new PermissionManager(config);
    let beforeRan = false;
    let afterRan = false;
    pm.addHook("before", () => {
      beforeRan = true;
    });
    pm.addHook("after", () => {
      afterRan = true;
    });
    await pm.shouldExecute("read_file", {});
    expect(beforeRan).toBe(true);
    expect(afterRan).toBe(true);
  });

  it("hooks don't block on error", async () => {
    const pm = new PermissionManager(config);
    pm.addHook("before", () => {
      throw new Error("hook error");
    });
    const [ok] = await pm.shouldExecute("read_file", {});
    expect(ok).toBe(true);
  });

  it("deriveSubagentPermissions makes more restrictive", () => {
    const pm = new PermissionManager(config);
    pm.setRules({ write_file: "allow", run_command: "ask" });
    const sub = pm.deriveSubagentPermissions();
    // allow → ask for subagent
    expect(sub.check("write_file", {})).toBe("approve");
    // ask stays ask
    expect(sub.check("run_command", {})).toBe("approve");
  });

  it("deriveSubagentPermissions deny stays deny", () => {
    const pm = new PermissionManager(config);
    pm.setRules({ read_file: "deny" });
    const sub = pm.deriveSubagentPermissions();
    expect(sub.check("read_file", {})).toBe("deny");
  });

  it("check priority: deny pattern over rules", () => {
    const pm = new PermissionManager(config);
    pm.setRules({ run_command: "allow" });
    // rm -rf / is always denied even if rule says allow
    expect(pm.check("run_command", { command: "rm -rf /" })).toBe("deny");
  });

  it("check priority: path pattern over default", () => {
    const pm = new PermissionManager(config);
    pm.addPathPattern("write_file", "config/*", "deny");
    expect(pm.check("write_file", { path: "config/settings.json" })).toBe("deny");
  });

  it("shouldExecute returns false for deny", async () => {
    const pm = new PermissionManager(config);
    const [ok, reason] = await pm.shouldExecute("run_command", { command: "rm -rf /" });
    expect(ok).toBe(false);
    expect(reason).toContain("Denied");
  });

  it("shouldExecute returns false for approve when not autoApprove", async () => {
    const pm = new PermissionManager(config);
    const [ok, reason] = await pm.shouldExecute("write_file", { path: "test.txt" });
    expect(ok).toBe(false);
    expect(reason).toContain("Approval required");
  });

  it("shouldExecute returns true when autoApprove", async () => {
    config.autoApprove = true;
    const pm = new PermissionManager(config);
    const [ok] = await pm.shouldExecute("write_file", { path: "test.txt" });
    expect(ok).toBe(true);
  });
});
