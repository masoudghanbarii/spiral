import * as readline from "node:readline";
import type { TraceManager } from "./managers/traces.js";
import { TraceEntry } from "./models.js";
import type { ChatMessage } from "./types.js";

export class InteractiveMode {
  private queue: string[] = [];
  private paused = false;
  private stop = false;
  private traces?: TraceManager;

  constructor(traces?: TraceManager) {
    this.traces = traces;
  }

  start(): void {
    const rl = readline.createInterface({ input: process.stdin, output: undefined });
    rl.on("line", (line: string) => this.handleInput(line.trim()));
    rl.on("close", () => {});
  }

  stop_(): void {}

  private handleInput(line: string): void {
    if (line.startsWith("/")) {
      this.handleCommand(line);
    } else {
      this.queue.push(line);
      this.traces?.record(
        new TraceEntry({
          event_type: "agent_step",
          loop_name: "interactive",
          feature: "*",
          data: { action: "user_input", content: line.slice(0, 200) },
        }),
      );
    }
  }

  private handleCommand(cmd: string): void {
    const parts = cmd.split(/\s+/);
    const command = parts[0];
    if (command === "/pause") this.paused = true;
    else if (command === "/resume") this.paused = false;
    else if (command === "/stop") this.stop = true;
    this.traces?.record(
      new TraceEntry({
        event_type: "agent_step",
        loop_name: "interactive",
        feature: "*",
        data: { action: "command", command },
      }),
    );
  }

  get hasInput(): boolean {
    return this.queue.length > 0;
  }

  getInput(): string | null {
    return this.queue.shift() ?? null;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get shouldStop(): boolean {
    return this.stop;
  }

  getPendingMessage(): ChatMessage | null {
    const text = this.getInput();
    if (text === null) return null;
    return { role: "user", content: text };
  }
}
