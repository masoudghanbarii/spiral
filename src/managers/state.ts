import { readFile, writeFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import { Config } from "../config.js";
import { HarnessState, type HarnessStateData } from "../models.js";

export class StateManager {
  private stateFile: string;

  constructor(config: Config) {
    this.stateFile = config.stateFile;
  }

  async load(): Promise<HarnessState | null> {
    try {
      const data = JSON.parse(await readFile(this.stateFile, "utf-8")) as HarnessStateData;
      return HarnessState.fromDict(data);
    } catch {
      return null;
    }
  }

  async save(state: HarnessState): Promise<void> {
    await mkdir(path.dirname(this.stateFile), { recursive: true });
    await writeFile(this.stateFile, JSON.stringify(state.toDict(), null, 2), "utf-8");
  }

  async reset(): Promise<void> {
    try {
      await unlink(this.stateFile);
    } catch {
      // already gone
    }
  }
}
