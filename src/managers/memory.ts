import { readFile, writeFile, mkdir, rm, rename, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Config } from "../config.js";
import type { SessionInfo } from "../types.js";

async function atomicWrite(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = filePath + ".tmp";
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  const { rename: rn } = await import("node:fs/promises");
  await rn(tmp, filePath);
}

async function atomicRead(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export class ProjectMemory {
  dir: string;
  private factsFile: string;
  private failuresFile: string;
  private preferencesFile: string;

  constructor(memoryDir: string) {
    this.dir = path.join(memoryDir, "project");
    this.factsFile = path.join(this.dir, "facts.json");
    this.failuresFile = path.join(this.dir, "failures.json");
    this.preferencesFile = path.join(this.dir, "preferences.json");
  }

  async getFacts(): Promise<Record<string, unknown>> {
    return ((await atomicRead(this.factsFile)) as Record<string, unknown>) ?? {};
  }

  async addFact(key: string, value: unknown): Promise<void> {
    const facts = await this.getFacts();
    facts[key] = value;
    await atomicWrite(this.factsFile, facts);
  }

  async getFailures(): Promise<Record<string, unknown>[]> {
    return ((await atomicRead(this.failuresFile)) as Record<string, unknown>[]) ?? [];
  }

  async addFailure(failure: Record<string, unknown>): Promise<void> {
    const failures = await this.getFailures();
    failures.push(failure);
    await atomicWrite(this.failuresFile, failures);
  }

  async getPreferences(): Promise<Record<string, unknown>> {
    return ((await atomicRead(this.preferencesFile)) as Record<string, unknown>) ?? {};
  }

  async setPreference(key: string, value: unknown): Promise<void> {
    const prefs = await this.getPreferences();
    prefs[key] = value;
    await atomicWrite(this.preferencesFile, prefs);
  }

  async getContextForPrompt(): Promise<string> {
    const facts = await this.getFacts();
    const failures = await this.getFailures();
    const prefs = await this.getPreferences();
    const parts: string[] = [];
    if (Object.keys(facts).length > 0)
      parts.push("Learned facts:\n" + JSON.stringify(facts, null, 2).slice(0, 1000));
    if (failures.length > 0)
      parts.push(
        "Known failure patterns:\n" + JSON.stringify(failures.slice(-5), null, 2).slice(0, 1000),
      );
    if (Object.keys(prefs).length > 0)
      parts.push("Agent preferences:\n" + JSON.stringify(prefs, null, 2).slice(0, 500));
    return parts.join("\n\n");
  }

  async sizeBytes(): Promise<number> {
    let total = 0;
    for (const f of [this.factsFile, this.failuresFile, this.preferencesFile]) {
      try {
        total += (await stat(f)).size;
      } catch {
        // skip
      }
    }
    return total;
  }
}

export class FeatureMemory {
  dir: string;
  private agentMessagesFile: string;
  private verificationFile: string;
  private toolHistoryFile: string;

  constructor(featuresDir: string, featureName: string) {
    const safe = featureName.replace(/[/\s]/g, "_");
    this.dir = path.join(featuresDir, safe);
    this.agentMessagesFile = path.join(this.dir, "agent_messages.json");
    this.verificationFile = path.join(this.dir, "verification.json");
    this.toolHistoryFile = path.join(this.dir, "tool_history.json");
  }

  async saveAgentMessages(messages: unknown[]): Promise<void> {
    await atomicWrite(this.agentMessagesFile, messages);
  }

  async getAgentMessages(): Promise<unknown[]> {
    return ((await atomicRead(this.agentMessagesFile)) as unknown[]) ?? [];
  }

  async saveVerification(result: Record<string, unknown>): Promise<void> {
    await atomicWrite(this.verificationFile, result);
  }

  async getVerification(): Promise<Record<string, unknown> | null> {
    return (await atomicRead(this.verificationFile)) as Record<string, unknown> | null;
  }

  async saveToolHistory(history: unknown[]): Promise<void> {
    await atomicWrite(this.toolHistoryFile, history);
  }

  async getToolHistory(): Promise<unknown[]> {
    return ((await atomicRead(this.toolHistoryFile)) as unknown[]) ?? [];
  }

  exists(): boolean {
    return existsSync(this.dir);
  }
}

export class SessionMemory {
  memoryDir: string;
  sessionId: string;
  dir: string;
  messagesFile: string;
  stateFile: string;
  contextFile: string;
  summaryFile: string;
  featuresDir: string;

  constructor(memoryDir: string, sessionId?: string) {
    this.memoryDir = memoryDir;
    this.sessionId =
      sessionId ??
      new Date().toISOString().replace(/[:.]/g, "").slice(0, 15) + "_" + randomUUID().slice(0, 6);
    this.dir = path.join(memoryDir, "sessions", this.sessionId);
    this.messagesFile = path.join(this.dir, "messages.json");
    this.stateFile = path.join(this.dir, "state.json");
    this.contextFile = path.join(this.dir, "context.json");
    this.summaryFile = path.join(this.dir, "summary.json");
    this.featuresDir = path.join(this.dir, "features");
  }

  exists(): boolean {
    return existsSync(this.dir);
  }

  async saveMessages(messages: Record<string, string>[]): Promise<void> {
    const compacted = messages.map((m) => ({
      role: m.role,
      content: m.role === "tool" ? (m.content ?? "").slice(0, 500) : (m.content ?? ""),
    }));
    await atomicWrite(this.messagesFile, compacted);
  }

  async getMessages(): Promise<Record<string, string>[]> {
    return ((await atomicRead(this.messagesFile)) as Record<string, string>[]) ?? [];
  }

  async saveState(state: unknown): Promise<void> {
    await atomicWrite(this.stateFile, state);
  }

  async getState(): Promise<unknown | null> {
    return atomicRead(this.stateFile);
  }

  async saveContext(ctx: Record<string, unknown>): Promise<void> {
    await atomicWrite(this.contextFile, ctx);
  }

  async getContext(): Promise<Record<string, unknown>> {
    return ((await atomicRead(this.contextFile)) as Record<string, unknown>) ?? {};
  }

  async getSummary(): Promise<string> {
    const data = (await atomicRead(this.summaryFile)) as { summary?: string } | null;
    return data?.summary ?? "";
  }

  async updateSummary(text: string): Promise<void> {
    await atomicWrite(this.summaryFile, { summary: text, updated: new Date().toISOString() });
  }

  getFeatureMemory(featureName: string): FeatureMemory {
    return new FeatureMemory(this.featuresDir, featureName);
  }

  async archiveFeature(featureName: string): Promise<void> {
    const featDir = path.join(this.featuresDir, featureName.replace(/[/\s]/g, "_"));
    const archiveDir = path.join(this.featuresDir, "_archive");
    if (existsSync(featDir)) {
      await mkdir(archiveDir, { recursive: true });
      let target = path.join(archiveDir, featureName);
      if (existsSync(target))
        target = path.join(archiveDir, `${featureName}_${randomUUID().slice(0, 4)}`);
      await rename(featDir, target);
    }
  }

  async listFeatures(): Promise<string[]> {
    if (!existsSync(this.featuresDir)) return [];
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(this.featuresDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && e.name !== "_archive").map((e) => e.name);
  }

  async sizeBytes(): Promise<number> {
    if (!existsSync(this.dir)) return 0;
    return dirSize(this.dir);
  }
}

async function dirSize(dir: string): Promise<number> {
  let total = 0;
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await dirSize(full);
    else total += (await stat(full)).size;
  }
  return total;
}

export class MemoryManager {
  config: Config;
  memoryDir: string;
  project: ProjectMemory;

  constructor(config: Config) {
    this.config = config;
    this.memoryDir = config.memoryDir;
    this.project = new ProjectMemory(this.memoryDir);
  }

  createSession(sessionId?: string): SessionMemory {
    return new SessionMemory(this.memoryDir, sessionId);
  }

  async listSessions(): Promise<SessionInfo[]> {
    const sessionsDir = path.join(this.memoryDir, "sessions");
    if (!existsSync(sessionsDir)) return [];
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(sessionsDir, { withFileTypes: true });
    const sessions: SessionInfo[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const sm = this.getSession(entry.name);
      const ctx = await sm.getContext();
      const state = (await sm.getState()) as {
        completed_features?: string[];
        failed_features?: string[];
        features?: unknown[];
      } | null;
      sessions.push({
        sessionId: entry.name,
        mode: (ctx.mode as string) ?? "unknown",
        started: (ctx.started as string) ?? "",
        completed: state?.completed_features?.length ?? 0,
        failed: state?.failed_features?.length ?? 0,
        total: state?.features?.length ?? 0,
        sizeBytes: await sm.sizeBytes(),
      });
    }
    return sessions;
  }

  getSession(sessionId: string): SessionMemory {
    return new SessionMemory(this.memoryDir, sessionId);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const dir = path.join(this.memoryDir, "sessions", sessionId);
    if (!existsSync(dir)) return false;
    await rm(dir, { recursive: true });
    return true;
  }

  async totalSizeBytes(): Promise<number> {
    if (!existsSync(this.memoryDir)) return 0;
    return dirSize(this.memoryDir);
  }
}
