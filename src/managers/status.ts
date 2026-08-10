import { writeFile, unlink, readFile, rename } from "node:fs/promises";
import { Config } from "../config.js";

export interface StatusData {
  ts: string;
  pid: number;
  loop: string;
  phase: string;
  feature: string;
  mode: string;
  agent_mode?: string;
  [key: string]: unknown;
}

export class StatusManager {
  private statusFile: string;

  constructor(config: Config) {
    this.statusFile = config.statusFile;
  }

  async write(data: Omit<StatusData, "ts" | "pid">): Promise<void> {
    const payload: StatusData = {
      ts: new Date().toISOString(),
      pid: process.pid,
      ...data,
    } as StatusData;
    const tmp = this.statusFile + ".tmp";
    await writeFile(tmp, JSON.stringify(payload, null, 2), "utf-8");
    await rename(tmp, this.statusFile);
  }

  async read(): Promise<StatusData | null> {
    try {
      return JSON.parse(await readFile(this.statusFile, "utf-8")) as StatusData;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await unlink(this.statusFile);
    } catch {
      // already gone
    }
  }
}
