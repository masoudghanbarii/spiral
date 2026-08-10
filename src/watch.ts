import { Config } from "./config.js";
import { StatusManager, type StatusData } from "./managers/status.js";
import { StateManager } from "./managers/state.js";
import { HarnessState, TraceEntry } from "./models.js";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

interface Snapshot {
  status: StatusData | null;
  state: HarnessState | null;
  traces: TraceEntry[];
  isAlive: boolean;
}

async function loadSnapshot(config: Config): Promise<Snapshot> {
  const statusMgr = new StatusManager(config);
  const stateMgr = new StateManager(config);

  const status = await statusMgr.read();
  const state = await stateMgr.load();

  let traces: TraceEntry[] = [];
  const tracesDir = config.tracesDir;
  if (existsSync(tracesDir)) {
    const { readdir } = await import("node:fs/promises");
    const files = (await readdir(tracesDir))
      .filter((f) => f.startsWith("session_") && f.endsWith(".jsonl"))
      .sort();
    for (const f of files.slice(-3)) {
      const content = await readFile(path.join(tracesDir, f), "utf-8");
      for (const line of content.split("\n")) {
        if (!line.trim()) continue;
        try {
          traces.push(TraceEntry.fromDict(JSON.parse(line)));
        } catch {
          continue;
        }
      }
    }
  }

  const isAlive = status ? checkPid(status.pid) : false;
  return { status, state, traces: traces.slice(-15), isAlive };
}

function checkPid(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function fmtDur(s: number): string {
  if (s <= 0) return "--";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

void fmtDur;

function clearScreen(): void {
  process.stdout.write("\x1B[2J\x1B[H");
}

export async function watch(config: Config, intervalMs = 1500): Promise<void> {
  console.log("[spiral watch] Press Ctrl+C to stop\n");

  while (true) {
    const snap = await loadSnapshot(config);
    clearScreen();

    const status = snap.status;
    const state = snap.state;
    const alive = snap.isAlive;

    const icon = alive ? "\x1B[32m●\x1B[0m" : "\x1B[31m●\x1B[0m";
    const mode = status?.mode ?? "--";
    const agentMode = status?.agent_mode ?? "normal";
    const pid = status?.pid ?? "--";
    const loop = status?.loop ?? "unknown";
    const phase = status?.phase ?? "unknown";
    const feature = status?.feature ?? "";

    const total = state?.features.length ?? 0;
    const completed = state?.completedFeatures.length ?? 0;
    const failed = state?.failedFeatures.length ?? 0;
    const remaining = total - completed - failed;
    const pct = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

    const barLen = 30;
    const filled = Math.round((pct / 100) * barLen);
    const bar = "█".repeat(filled) + "░".repeat(barLen - filled);

    console.log(`${icon} \x1B[1mspiral\x1B[0m  MODE ${mode}  PID ${pid}  (${agentMode})`);
    console.log(
      `PROGRESS [${bar}] ${completed + failed}/${total} (${pct}%)  ✓${completed} ✗${failed}`,
    );
    console.log(`LOOP     ${loop} ▸ ${phase}`);
    if (feature) console.log(`FEATURE  "${feature}"`);
    console.log(`REMAINING ${remaining}`);

    if (snap.traces.length > 0) {
      console.log("\nRECENT EVENTS");
      for (const t of snap.traces.slice(-8)) {
        console.log(
          `  [${t.eventType}] ${t.loopName}:${t.feature} → ${JSON.stringify(t.data).slice(0, 80)}`,
        );
      }
    }

    if (state && state.failedFeatures.length > 0) {
      console.log("\n\x1B[31mFAILURES\x1B[0m");
      for (const f of state.failedFeatures.slice(-5)) {
        console.log(`  ✗ ${f}`);
      }
    }

    if (!alive && status) {
      console.log(`\n\x1B[31m● PID ${status.pid} not running\x1B[0m (last: ${loop}/${phase})`);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
