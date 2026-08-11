#!/usr/bin/env node
import { Command } from "commander";
import { Config } from "./config.js";
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import path from "node:path";

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

// ── models ──────────────────────────────────────────────────

const PROVIDER_INFO: Array<{
  name: string;
  envKey: string;
  defaultModel: string;
  label: string;
}> = [
  { name: "ollama", envKey: "", defaultModel: "deepseek-v4-flash:cloud", label: "Ollama" },
  { name: "anthropic", envKey: "ANTHROPIC_API_KEY", defaultModel: "claude-sonnet-4-20250514", label: "Anthropic" },
  { name: "openai", envKey: "OPENAI_API_KEY", defaultModel: "gpt-4o", label: "OpenAI" },
  { name: "gemini", envKey: "GEMINI_API_KEY", defaultModel: "gemini-2.0-flash", label: "Google Gemini" },
  { name: "xai", envKey: "XAI_API_KEY", defaultModel: "grok-3", label: "xAI" },
  { name: "mistral", envKey: "MISTRAL_API_KEY", defaultModel: "mistral-large-latest", label: "Mistral" },
  { name: "groq", envKey: "GROQ_API_KEY", defaultModel: "llama-3.3-70b-versatile", label: "Groq" },
  { name: "openrouter", envKey: "OPENROUTER_API_KEY", defaultModel: "auto", label: "OpenRouter" },
  { name: "deepseek", envKey: "DEEPSEEK_API_KEY", defaultModel: "deepseek-chat", label: "DeepSeek" },
  { name: "together", envKey: "TOGETHER_API_KEY", defaultModel: "meta-llama/Llama-3-70b-chat-hf", label: "Together" },
];

program
  .command("models")
  .description("List available models and providers")
  .action(async () => {
    console.log("Provider".padEnd(14) + "Default Model".padEnd(36) + "API Key");
    console.log("-".repeat(66));
    for (const p of PROVIDER_INFO) {
      const hasKey = p.envKey ? (process.env[p.envKey] ? "✓ configured" : "✗ not set") : "n/a (local)";
      console.log(p.label.padEnd(14) + p.defaultModel.padEnd(36) + hasKey);
    }
    console.log("\nSet API keys with: spiral providers login <provider>");
  });

// ── providers ───────────────────────────────────────────────

const VALID_PROVIDERS = new Set(PROVIDER_INFO.map((p) => p.name));

const providersCmd = program.command("providers").description("Manage providers");

providersCmd
  .command("login <provider>")
  .description("Set API key for a provider")
  .action(async (provider: string) => {
    if (!VALID_PROVIDERS.has(provider)) {
      console.error(`Unknown provider: ${provider}`);
      console.error(`Valid providers: ${[...VALID_PROVIDERS].join(", ")}`);
      process.exit(1);
    }
    const info = PROVIDER_INFO.find((p) => p.name === provider)!;
    if (!info.envKey) {
      console.log(`${info.label} does not require an API key (local provider).`);
      return;
    }
    // Check if already set
    if (process.env[info.envKey]) {
      console.log(`${info.label} API key is already set in environment (${info.envKey}).`);
      return;
    }
    // Prompt for key
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const key = await rl.question(`Enter API key for ${info.label} (${info.envKey}): `);
    rl.close();
    if (!key.trim()) {
      console.log("No key entered. Aborting.");
      return;
    }
    // Write to .env file in spiral dir
    const config = new Config();
    const envFile = path.join(config.spiralDir, ".env");
    let existing = "";
    if (existsSync(envFile)) {
      existing = await readFile(envFile, "utf-8");
    }
    const line = `${info.envKey}=${key.trim()}`;
    if (existing.includes(`${info.envKey}=`)) {
      existing = existing.replace(new RegExp(`${info.envKey}=.*`), line);
    } else {
      existing = existing.trimEnd() + "\n" + line + "\n";
    }
    await writeFile(envFile, existing, "utf-8");
    console.log(`API key saved to ${envFile}`);
    console.log(`To use it now, run: export ${info.envKey}=${key.trim()}`);
  });

// ── stats ───────────────────────────────────────────────────

program
  .command("stats")
  .description("Show usage statistics")
  .action(async () => {
    const { MemoryManager } = await import("./managers/memory.js");
    const config = new Config();
    const mm = new MemoryManager(config);
    const sessions = await mm.listSessions();
    const totalSize = await mm.totalSizeBytes();
    let totalMessages = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    let totalFeatures = 0;
    for (const s of sessions) {
      const session = mm.getSession(s.sessionId);
      const messages = await session.getMessages();
      totalMessages += messages.length;
      totalCompleted += s.completed;
      totalFailed += s.failed;
      totalFeatures += s.total;
    }
    console.log("Spiral Usage Statistics");
    console.log("======================");
    console.log(`Sessions:      ${sessions.length}`);
    console.log(`Messages:      ${totalMessages}`);
    console.log(`Features done: ${totalCompleted}`);
    console.log(`Features failed: ${totalFailed}`);
    console.log(`Features total:  ${totalFeatures}`);
    console.log(`Memory size:   ${formatBytes(totalSize)}`);
    // Rough cost estimate based on message count
    const estTokens = totalMessages * 500; // ~500 tokens per message average
    const estCost = (estTokens / 1_000_000) * 0.15; // $0.15/1M tokens (rough)
    console.log(`Est. tokens:   ~${estTokens.toLocaleString()}`);
    console.log(`Est. cost:    ~$${estCost.toFixed(4)}`);
  });

// ── debug ───────────────────────────────────────────────────

program
  .command("debug")
  .description("Run diagnostics")
  .action(async () => {
    const config = new Config();
    const issues: Array<{ check: string; status: "ok" | "fail"; detail: string }> = [];

    // Check Ollama connectivity
    try {
      const resp = await fetch(config.ollamaBaseUrl, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        issues.push({ check: "Ollama connectivity", status: "ok", detail: `Connected to ${config.ollamaBaseUrl}` });
      } else {
        issues.push({ check: "Ollama connectivity", status: "fail", detail: `HTTP ${resp.status} from ${config.ollamaBaseUrl}` });
      }
    } catch (e) {
      issues.push({ check: "Ollama connectivity", status: "fail", detail: `Cannot reach ${config.ollamaBaseUrl}: ${(e as Error).message}` });
    }

    // Check file permissions
    try {
      await mkdir(config.spiralDir, { recursive: true });
      const testFile = path.join(config.spiralDir, ".write_test");
      await writeFile(testFile, "test", "utf-8");
      const { rm } = await import("node:fs/promises");
      await rm(testFile);
      issues.push({ check: "File permissions", status: "ok", detail: "Read/write access to spiral dir" });
    } catch (e) {
      issues.push({ check: "File permissions", status: "fail", detail: `Cannot write to ${config.spiralDir}: ${(e as Error).message}` });
    }

    // Check disk space
    try {
      const { execSync } = await import("node:child_process");
      const output = execSync("df -h .", { encoding: "utf-8" });
      const lines = output.trim().split("\n");
      const lastLine = lines[lines.length - 1]!;
      const parts = lastLine.split(/\s+/);
      const avail = parts[3] ?? "unknown";
      const usePct = parts[4] ?? "unknown";
      const useNum = parseInt(usePct);
      if (useNum > 90) {
        issues.push({ check: "Disk space", status: "fail", detail: `Disk ${usePct} full, only ${avail} available` });
      } else {
        issues.push({ check: "Disk space", status: "ok", detail: `${avail} available (${usePct} used)` });
      }
    } catch {
      issues.push({ check: "Disk space", status: "ok", detail: "Unable to check (skipping)" });
    }

    // Check config validity
    const errors = config.validate();
    if (errors.length === 0) {
      issues.push({ check: "Config validity", status: "ok", detail: "No configuration errors" });
    } else {
      issues.push({ check: "Config validity", status: "fail", detail: errors.join("; ") });
    }

    // Check skills dir
    if (existsSync(config.skillsDir)) {
      const entries = await readdir(config.skillsDir, { withFileTypes: true });
      const skillCount = entries.filter((e) => e.isDirectory()).length;
      issues.push({ check: "Skills directory", status: "ok", detail: `${skillCount} skills found` });
    } else {
      issues.push({ check: "Skills directory", status: "fail", detail: `${config.skillsDir} does not exist` });
    }

    // Check memory dir
    if (existsSync(config.memoryDir)) {
      issues.push({ check: "Memory directory", status: "ok", detail: `${config.memoryDir} exists` });
    } else {
      issues.push({ check: "Memory directory", status: "fail", detail: `${config.memoryDir} does not exist` });
    }

    // Print results
    console.log("Spiral Diagnostics");
    console.log("=================");
    for (const issue of issues) {
      const icon = issue.status === "ok" ? "✓" : "✗";
      console.log(`${icon} ${issue.check}: ${issue.detail}`);
    }
    const failures = issues.filter((i) => i.status === "fail");
    if (failures.length > 0) {
      console.log(`\n${failures.length} issue(s) found. Run 'spiral doctor' to attempt fixes.`);
    } else {
      console.log("\nAll checks passed.");
    }
  });

// ── doctor ──────────────────────────────────────────────────

program
  .command("doctor")
  .description("Run diagnostic checks and attempt fixes")
  .action(async () => {
    const config = new Config();
    const fixes: string[] = [];

    // Check Ollama connectivity
    try {
      const resp = await fetch(config.ollamaBaseUrl, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) {
        console.log(`⚠ Ollama returned HTTP ${resp.status}. Cannot fix automatically.`);
      } else {
        console.log("✓ Ollama connectivity OK");
      }
    } catch (e) {
      console.log(`✗ Cannot reach Ollama at ${config.ollamaBaseUrl}: ${(e as Error).message}`);
      console.log("  Try: ollama serve  (or check if Ollama is installed)");
    }

    // Fix: spiral dir permissions
    try {
      await mkdir(config.spiralDir, { recursive: true });
      const testFile = path.join(config.spiralDir, ".write_test");
      await writeFile(testFile, "test", "utf-8");
      const { rm } = await import("node:fs/promises");
      await rm(testFile);
      console.log("✓ Spiral dir writable");
    } catch (e) {
      console.log(`✗ Cannot write to ${config.spiralDir}: ${(e as Error).message}`);
      try {
        const { execSync } = await import("node:child_process");
        execSync(`chmod -R u+w ${config.spiralDir}`, { stdio: "inherit" });
        console.log("  Fixed: adjusted permissions");
        fixes.push("Fixed spiral dir permissions");
      } catch {
        console.log("  Cannot fix automatically. Run: chmod -R u+w " + config.spiralDir);
      }
    }

    // Fix: skills dir
    if (!existsSync(config.skillsDir)) {
      try {
        await mkdir(config.skillsDir, { recursive: true });
        console.log(`✓ Created skills directory: ${config.skillsDir}`);
        fixes.push("Created skills directory");
      } catch (e) {
        console.log(`✗ Cannot create skills dir: ${(e as Error).message}`);
      }
    } else {
      console.log("✓ Skills directory exists");
    }

    // Fix: memory dir
    if (!existsSync(config.memoryDir)) {
      try {
        await mkdir(config.memoryDir, { recursive: true });
        console.log(`✓ Created memory directory: ${config.memoryDir}`);
        fixes.push("Created memory directory");
      } catch (e) {
        console.log(`✗ Cannot create memory dir: ${(e as Error).message}`);
      }
    } else {
      console.log("✓ Memory directory exists");
    }

    // Fix: traces dir
    if (!existsSync(config.tracesDir)) {
      try {
        await mkdir(config.tracesDir, { recursive: true });
        console.log(`✓ Created traces directory: ${config.tracesDir}`);
        fixes.push("Created traces directory");
      } catch (e) {
        console.log(`✗ Cannot create traces dir: ${(e as Error).message}`);
      }
    } else {
      console.log("✓ Traces directory exists");
    }

    // Check config validity
    const errors = config.validate();
    if (errors.length === 0) {
      console.log("✓ Config valid");
    } else {
      console.log("✗ Config errors:");
      for (const err of errors) {
        console.log(`  - ${err}`);
      }
      console.log("  Fix manually by updating environment variables or config file.");
    }

    // Check disk space
    try {
      const { execSync } = await import("node:child_process");
      const output = execSync("df -h .", { encoding: "utf-8" });
      const lines = output.trim().split("\n");
      const lastLine = lines[lines.length - 1]!;
      const parts = lastLine.split(/\s+/);
      const usePct = parts[4] ?? "0%";
      const useNum = parseInt(usePct);
      if (useNum > 90) {
        console.log(`✗ Disk space low: ${usePct} used`);
        console.log("  Free up space or increase disk size.");
      } else {
        console.log(`✓ Disk space OK (${usePct} used)`);
      }
    } catch {
      console.log("✓ Disk space check skipped");
    }

    // Summary
    if (fixes.length > 0) {
      console.log(`\n${fixes.length} fix(es) applied:`);
      for (const f of fixes) {
        console.log(`  - ${f}`);
      }
    } else {
      console.log("\nNo fixes needed.");
    }
  });

// ── config get/set ─────────────────────────────────────────

const CONFIG_KEYS = new Set([
  "ollamaBaseUrl",
  "ollamaApiKey",
  "model",
  "projectDir",
  "spiralDir",
  "maxAgentIterations",
  "maxVerificationRetries",
  "engineAnalysisInterval",
  "verificationTimeoutS",
  "watchPollIntervalS",
  "autoApprove",
  "contextWindowTokens",
  "compactionThreshold",
  "compactionKeepRecent",
  "streamEnabled",
  "llmProvider",
  "agentMode",
  "profile",
]);

const configCmd = program.command("config").description("Get/set config values");

configCmd
  .command("get [key]")
  .description("Get config value(s)")
  .action(async (key?: string) => {
    const config = new Config();
    if (key) {
      if (!CONFIG_KEYS.has(key)) {
        console.error(`Unknown config key: ${key}`);
        console.error(`Valid keys: ${[...CONFIG_KEYS].join(", ")}`);
        process.exit(1);
      }
      const value = (config as unknown as Record<string, unknown>)[key];
      console.log(`${key} = ${value}`);
    } else {
      for (const k of CONFIG_KEYS) {
        const value = (config as unknown as Record<string, unknown>)[k];
        console.log(`${k} = ${value}`);
      }
    }
  });

configCmd
  .command("set <key> <value>")
  .description("Set config value")
  .action(async (key: string, value: string) => {
    if (!CONFIG_KEYS.has(key)) {
      console.error(`Unknown config key: ${key}`);
      console.error(`Valid keys: ${[...CONFIG_KEYS].join(", ")}`);
      process.exit(1);
    }
    const config = new Config();
    const envMap: Record<string, string> = {
      ollamaBaseUrl: "SPIRAL_OLLAMA_BASE_URL",
      ollamaApiKey: "SPIRAL_OLLAMA_API_KEY",
      model: "SPIRAL_MODEL",
      projectDir: "SPIRAL_PROJECT_DIR",
      maxAgentIterations: "SPIRAL_MAX_AGENT_ITERATIONS",
      maxVerificationRetries: "SPIRAL_MAX_VERIFICATION_RETRIES",
      engineAnalysisInterval: "SPIRAL_ENGINE_ANALYSIS_INTERVAL",
      verificationTimeoutS: "SPIRAL_VERIFICATION_TIMEOUT_S",
      watchPollIntervalS: "SPIRAL_WATCH_POLL_INTERVAL_S",
      autoApprove: "SPIRAL_AUTO_APPROVE",
      contextWindowTokens: "SPIRAL_CONTEXT_WINDOW_TOKENS",
      compactionThreshold: "SPIRAL_COMPACTION_THRESHOLD",
      compactionKeepRecent: "SPIRAL_COMPACTION_KEEP_RECENT",
      streamEnabled: "SPIRAL_STREAM",
      llmProvider: "SPIRAL_LLM_PROVIDER",
      agentMode: "SPIRAL_AGENT_MODE",
      profile: "SPIRAL_PROFILE",
    };
    const envKey = envMap[key];
    if (!envKey) {
      console.error(`Cannot set '${key}' via CLI. Use environment variable directly.`);
      process.exit(1);
    }
    // Write to .env file
    const envFile = path.join(config.spiralDir, ".env");
    let existing = "";
    if (existsSync(envFile)) {
      existing = await readFile(envFile, "utf-8");
    }
    // Type coercion for booleans and numbers
    let typedValue = value;
    if (["true", "false"].includes(value.toLowerCase())) {
      typedValue = value.toLowerCase();
    }
    const line = `${envKey}=${typedValue}`;
    if (existing.includes(`${envKey}=`)) {
      existing = existing.replace(new RegExp(`${envKey}=.*`), line);
    } else {
      existing = existing.trimEnd() + "\n" + line + "\n";
    }
    await writeFile(envFile, existing, "utf-8");
    console.log(`Set ${key} = ${typedValue}`);
    console.log(`Written to ${envFile}`);
    console.log(`To use now: export ${envKey}=${typedValue}`);
  });

// ── mcp ─────────────────────────────────────────────────────

interface McpServer {
  command?: string;
  args?: string[];
  url?: string;
  transport: "stdio" | "http";
}

const mcpCmd = program.command("mcp").description("Manage MCP servers");

mcpCmd
  .command("add <name>")
  .description("Add MCP server")
  .option("--command <cmd>", "Command to run (stdio transport)")
  .option("--args <args...>", "Arguments for the command")
  .option("--url <url>", "Server URL (http transport)")
  .option("--transport <type>", "Transport type: stdio|http", "stdio")
  .action(async (name: string, opts: {
    command?: string;
    args?: string[];
    url?: string;
    transport?: string;
  }) => {
    const transport = opts.transport as "stdio" | "http";
    if (transport !== "stdio" && transport !== "http") {
      console.error("Transport must be 'stdio' or 'http'");
      process.exit(1);
    }
    if (transport === "stdio" && !opts.command) {
      console.error("stdio transport requires --command");
      process.exit(1);
    }
    if (transport === "http" && !opts.url) {
      console.error("http transport requires --url");
      process.exit(1);
    }
    const config = new Config();
    const mcpFile = path.join(config.spiralDir, "mcp.json");
    let servers: Record<string, McpServer> = {};
    if (existsSync(mcpFile)) {
      try {
        servers = JSON.parse(await readFile(mcpFile, "utf-8"));
      } catch {
        // start fresh
      }
    }
    servers[name] = {
      command: opts.command,
      args: opts.args,
      url: opts.url,
      transport,
    };
    await mkdir(path.dirname(mcpFile), { recursive: true });
    await writeFile(mcpFile, JSON.stringify(servers, null, 2), "utf-8");
    console.log(`MCP server '${name}' added`);
  });

mcpCmd
  .command("list")
  .description("List MCP servers")
  .action(async () => {
    const config = new Config();
    const mcpFile = path.join(config.spiralDir, "mcp.json");
    if (!existsSync(mcpFile)) {
      console.log("[spiral] No MCP servers configured");
      return;
    }
    try {
      const servers = JSON.parse(await readFile(mcpFile, "utf-8")) as Record<string, McpServer>;
      const names = Object.keys(servers);
      if (names.length === 0) {
        console.log("[spiral] No MCP servers configured");
        return;
      }
      console.log("Name".padEnd(20) + "Transport".padEnd(10) + "Command/URL");
      console.log("-".repeat(60));
      for (const [name, server] of Object.entries(servers)) {
        const target = server.transport === "http" ? server.url : server.command;
        console.log(name.padEnd(20) + server.transport.padEnd(10) + (target ?? ""));
      }
    } catch {
      console.log("[spiral] No MCP servers configured");
    }
  });

mcpCmd
  .command("remove <name>")
  .description("Remove MCP server")
  .action(async (name: string) => {
    const config = new Config();
    const mcpFile = path.join(config.spiralDir, "mcp.json");
    if (!existsSync(mcpFile)) {
      console.log(`[spiral] No MCP server named '${name}'`);
      return;
    }
    let servers: Record<string, McpServer> = {};
    try {
      servers = JSON.parse(await readFile(mcpFile, "utf-8"));
    } catch {
      console.log(`[spiral] No MCP server named '${name}'`);
      return;
    }
    if (!(name in servers)) {
      console.log(`[spiral] No MCP server named '${name}'`);
      return;
    }
    delete servers[name];
    await writeFile(mcpFile, JSON.stringify(servers, null, 2), "utf-8");
    console.log(`MCP server '${name}' removed`);
  });

program.parse();

// ── helpers ────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}