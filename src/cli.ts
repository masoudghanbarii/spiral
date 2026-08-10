#!/usr/bin/env node
import { Command } from "commander";
import { Config } from "./config.js";

const program = new Command();

program
  .name("spiral")
  .description("Spiral — AI Co-founder powered by hill climbing loop architecture")
  .version("0.1.0")
  .action(async () => {
    const { startTui } = await import("./tui/index.js");
    const config = new Config();
    await startTui(config);
  });

program
  .command("tui")
  .description("Start the interactive TUI (terminal user interface)")
  .option("--project-dir <path>", "Path to target project")
  .option("--session-id <id>", "Session ID for multi-session support")
  .option("--message <text>", "Send an initial message")
  .action(async (opts: { projectDir?: string; sessionId?: string; message?: string }) => {
    const { startTui } = await import("./tui/index.js");
    const config = new Config();
    if (opts.projectDir) config.setProjectDir(opts.projectDir);
    await startTui(config, { sessionId: opts.sessionId, initialMessage: opts.message });
  });

program
  .command("chat")
  .description("Start the TUI in local mode (alias for tui)")
  .option("--project-dir <path>", "Path to target project")
  .option("--session-id <id>", "Session ID for multi-session support")
  .option("--message <text>", "Send an initial message")
  .action(async (opts: { projectDir?: string; sessionId?: string; message?: string }) => {
    const { startTui } = await import("./tui/index.js");
    const config = new Config();
    if (opts.projectDir) config.setProjectDir(opts.projectDir);
    await startTui(config, { sessionId: opts.sessionId, initialMessage: opts.message });
  });

program
  .command("run")
  .description("Execute all features once")
  .option("--project-dir <path>", "Path to target project")
  .option("--behavior <mode>", "Agent mode: normal|plan|bypass|safe|interactive")
  .option("--session-id <id>", "Session ID for multi-session support")
  .action(async (opts: { projectDir?: string; behavior?: string; sessionId?: string }) => {
    const { Harness } = await import("./harness.js");
    const config = new Config();
    if (opts.projectDir) config.setProjectDir(opts.projectDir);
    if (opts.behavior) config.agentMode = opts.behavior;
    const harness = new Harness(config);
    if (opts.sessionId) harness.setSessionId(opts.sessionId);
    await harness.run();
  });

program
  .command("forever")
  .description("Run continuously until interrupted")
  .option("--project-dir <path>", "Path to target project")
  .option("--behavior <mode>", "Agent mode: normal|plan|bypass|safe|interactive")
  .option("--session-id <id>", "Session ID for multi-session support")
  .action(async (opts: { projectDir?: string; behavior?: string; sessionId?: string }) => {
    const { Harness } = await import("./harness.js");
    const config = new Config();
    if (opts.projectDir) config.setProjectDir(opts.projectDir);
    if (opts.behavior) config.agentMode = opts.behavior;
    const harness = new Harness(config);
    if (opts.sessionId) harness.setSessionId(opts.sessionId);
    await harness.runForever();
  });

program
  .command("init")
  .description("Parse ADR and initialize feature queue")
  .option("--project-dir <path>", "Path to target project")
  .option("--session-id <id>", "Session ID for multi-session support")
  .action(async (opts: { projectDir?: string; sessionId?: string }) => {
    const { Harness } = await import("./harness.js");
    const config = new Config();
    if (opts.projectDir) config.setProjectDir(opts.projectDir);
    const harness = new Harness(config);
    if (opts.sessionId) harness.setSessionId(opts.sessionId);
    await harness.initialize();
    console.log(`[spiral] Initialized. ${harness.state?.features.length ?? 0} features ready.`);
  });

program
  .command("reset")
  .description("Clear persisted state")
  .action(async () => {
    const { StateManager } = await import("./managers/state.js");
    const config = new Config();
    const sm = new StateManager(config);
    sm.reset();
    console.log("[spiral] State reset");
  });

program
  .command("sessions")
  .description("List all sessions")
  .action(async () => {
    const { MemoryManager } = await import("./managers/memory.js");
    const config = new Config();
    const mm = new MemoryManager(config);
    const sessions = await mm.listSessions();
    if (sessions.length === 0) {
      console.log("[spiral] No sessions found");
      return;
    }
    console.log(
      "Session ID".padEnd(30) +
        "Mode".padEnd(12) +
        "Done".padEnd(8) +
        "Fail".padEnd(8) +
        "Total".padEnd(8) +
        "Size",
    );
    console.log("-".repeat(75));
    for (const s of sessions) {
      console.log(
        s.sessionId.padEnd(30) +
          s.mode.padEnd(12) +
          String(s.completed).padEnd(8) +
          String(s.failed).padEnd(8) +
          String(s.total).padEnd(8) +
          `${s.sizeBytes}B`,
      );
    }
  });

program
  .command("watch")
  .description("Live dashboard showing rate, ETA, loop phase, LLM latency")
  .option("--project-dir <path>", "Path to target project")
  .action(async (opts: { projectDir?: string }) => {
    const { watch } = await import("./watch.js");
    const config = new Config();
    if (opts.projectDir) config.setProjectDir(opts.projectDir);
    await watch(config);
  });

program.parse();
