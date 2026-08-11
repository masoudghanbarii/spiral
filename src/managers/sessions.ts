import { randomUUID } from "node:crypto";
import { MemoryManager, SessionMemory } from "./memory.js";
import type { SessionInfo } from "../types.js";

export interface SessionExport {
  sessionId: string;
  messages: Record<string, string>[];
  state: unknown;
  context: Record<string, unknown>;
  summary: string;
  exportedAt: string;
  version: string;
}

export interface BranchInfo {
  sessionId: string;
  parentSessionId: string;
  name: string;
  createdAt: string;
}

interface BranchRecord {
  parentSessionId: string;
  sessionId: string;
  name: string;
  createdAt: string;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "credential",
]);

function redactSensitive(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(redactSensitive);
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key) || /password|secret|token|key/i.test(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactSensitive(value);
      }
    }
    return result;
  }
  return data;
}

export class SessionManager {
  private memory: MemoryManager;
  private branches: Map<string, BranchRecord[]> = new Map();
  private branchesFile: string;

  constructor(memory: MemoryManager) {
    this.memory = memory;
    this.branchesFile = `${memory.memoryDir}/branches.json`;
    this.loadBranches();
  }

  private async loadBranches(): Promise<void> {
    try {
      const { readFile } = await import("node:fs/promises");
      const data = JSON.parse(await readFile(this.branchesFile, "utf-8")) as BranchRecord[];
      for (const rec of data) {
        const list = this.branches.get(rec.parentSessionId) ?? [];
        list.push(rec);
        this.branches.set(rec.parentSessionId, list);
      }
    } catch {
      // no branches file yet
    }
  }

  private async saveBranches(): Promise<void> {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");
    await mkdir(path.dirname(this.branchesFile), { recursive: true });
    const all: BranchRecord[] = [];
    for (const list of this.branches.values()) all.push(...list);
    await writeFile(this.branchesFile, JSON.stringify(all, null, 2), "utf-8");
  }

  /**
   * Create a new session from an existing one, copying messages up to an optional point.
   */
  async forkSession(sessionId: string, fromPoint?: number): Promise<SessionMemory> {
    const source = this.memory.getSession(sessionId);
    if (!source.exists()) {
      throw new Error(`Session ${sessionId} does not exist`);
    }

    const newSessionId = `fork_${new Date().toISOString().replace(/[:.]/g, "").slice(0, 15)}_${randomUUID().slice(0, 6)}`;
    const fork = this.memory.createSession(newSessionId);

    let messages = await source.getMessages();
    if (fromPoint !== undefined && fromPoint >= 0) {
      messages = messages.slice(0, fromPoint + 1);
    }
    await fork.saveMessages(messages);

    const state = await source.getState();
    if (state !== null) await fork.saveState(state);

    const ctx = await source.getContext();
    if (Object.keys(ctx).length > 0) {
      await fork.saveContext({ ...ctx, forkedFrom: sessionId, forkedAt: new Date().toISOString() });
    }

    const summary = await source.getSummary();
    if (summary) await fork.updateSummary(summary);

    return fork;
  }

  /**
   * Export a session as JSON with sensitive data redacted.
   */
  async exportSession(sessionId: string): Promise<SessionExport> {
    const session = this.memory.getSession(sessionId);
    if (!session.exists()) {
      throw new Error(`Session ${sessionId} does not exist`);
    }

    const messages = await session.getMessages();
    const state = await session.getState();
    const context = await session.getContext();
    const summary = await session.getSummary();

    return {
      sessionId,
      messages: redactSensitive(messages) as Record<string, string>[],
      state: redactSensitive(state),
      context: redactSensitive(context) as Record<string, unknown>,
      summary,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    };
  }

  /**
   * Import a session from JSON data.
   */
  async importSession(data: SessionExport): Promise<SessionMemory> {
    if (!data.sessionId || !data.version) {
      throw new Error("Invalid session export: missing sessionId or version");
    }

    const sessionId = `imported_${data.sessionId}_${randomUUID().slice(0, 6)}`;
    const session = this.memory.createSession(sessionId);

    if (data.messages?.length) {
      await session.saveMessages(data.messages);
    }
    if (data.state !== null && data.state !== undefined) {
      await session.saveState(data.state);
    }
    if (data.context && Object.keys(data.context).length > 0) {
      await session.saveContext({
        ...data.context,
        importedFrom: data.sessionId,
        importedAt: new Date().toISOString(),
      });
    }
    if (data.summary) {
      await session.updateSummary(data.summary);
    }

    return session;
  }

  /**
   * Generate a shareable representation of a session (JSON for now).
   */
  async shareSession(sessionId: string): Promise<string> {
    const exportData = await this.exportSession(sessionId);
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Create a child session linked to a parent.
   */
  async branchSession(sessionId: string, name: string): Promise<SessionMemory> {
    const source = this.memory.getSession(sessionId);
    if (!source.exists()) {
      throw new Error(`Session ${sessionId} does not exist`);
    }

    const branchId = `branch_${name.replace(/[/\s]/g, "_")}_${randomUUID().slice(0, 6)}`;
    const branch = this.memory.createSession(branchId);

    // Copy messages from parent
    const messages = await source.getMessages();
    await branch.saveMessages(messages);

    // Copy state
    const state = await source.getState();
    if (state !== null) await branch.saveState(state);

    // Copy context with branch metadata
    const ctx = await source.getContext();
    await branch.saveContext({
      ...ctx,
      branchOf: sessionId,
      branchName: name,
      branchedAt: new Date().toISOString(),
    });

    // Copy summary
    const summary = await source.getSummary();
    if (summary) await branch.updateSummary(summary);

    // Register the branch
    const record: BranchRecord = {
      parentSessionId: sessionId,
      sessionId: branchId,
      name,
      createdAt: new Date().toISOString(),
    };
    const list = this.branches.get(sessionId) ?? [];
    list.push(record);
    this.branches.set(sessionId, list);
    await this.saveBranches();

    return branch;
  }

  /**
   * List child sessions of a parent.
   */
  listBranches(sessionId: string): BranchInfo[] {
    const records = this.branches.get(sessionId) ?? [];
    return records.map((r) => ({
      sessionId: r.sessionId,
      parentSessionId: r.parentSessionId,
      name: r.name,
      createdAt: r.createdAt,
    }));
  }

  /**
   * List all sessions (delegates to MemoryManager).
   */
  async listSessions(): Promise<SessionInfo[]> {
    return this.memory.listSessions();
  }
}