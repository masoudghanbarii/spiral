import { appendFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Config } from "../config.js";
import { TraceEntry } from "../models.js";
import type { TraceEventType } from "../types.js";

export class TraceManager {
  private tracesDir: string;
  private sessionId: string;
  private buffer: TraceEntry[] = [];

  constructor(config: Config) {
    this.tracesDir = config.tracesDir;
    const now = new Date();
    this.sessionId = now.toISOString().replace(/[:.]/g, "").slice(0, 15);
  }

  get sessionFile(): string {
    return path.join(this.tracesDir, `session_${this.sessionId}.jsonl`);
  }

  async record(entry: TraceEntry): Promise<void> {
    this.buffer.push(entry);
    await mkdir(this.tracesDir, { recursive: true });
    await appendFile(this.sessionFile, JSON.stringify(entry.toDict()) + "\n", "utf-8");
  }

  getSessionTraces(): TraceEntry[] {
    return [...this.buffer];
  }

  getTracesByFeature(feature: string): TraceEntry[] {
    return this.buffer.filter((t) => t.feature === feature);
  }

  getTracesByType(eventType: TraceEventType): TraceEntry[] {
    return this.buffer.filter((t) => t.eventType === eventType);
  }

  getEngineFeed(): string {
    const recent = this.buffer.slice(-50);
    return recent
      .map(
        (t) =>
          `[${t.eventType}] ${t.loopName}:${t.feature} -> ${JSON.stringify(t.data).slice(0, 200)}`,
      )
      .join("\n");
  }

  async loadSession(filePath: string): Promise<TraceEntry[]> {
    try {
      const content = await readFile(filePath, "utf-8");
      return content
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => TraceEntry.fromDict(JSON.parse(l)));
    } catch {
      return [];
    }
  }
}
