import { Config } from "./config.js";
import { LLMClient } from "./llm.js";
import { AgentLoop } from "./loops/agent.js";
import { EngineAnalysisLoop } from "./loops/engine.js";
import { EventDriver } from "./loops/event_driver.js";
import { VerificationLoop } from "./loops/verifier.js";
import { ManagerRegistry } from "./managers/index.js";
import type { SessionMemory } from "./managers/memory.js";
import { HarnessState } from "./models.js";
import { Timer, type FeatureTiming, type LoopTiming } from "./timer.js";
import type { AgentMode } from "./types.js";
import { ToolRegistry } from "./tools/registry.js";

export class Harness {
  config: Config;
  agentMode: AgentMode;
  managers: ManagerRegistry;
  llm: LLMClient;
  tools: ToolRegistry;
  agent: AgentLoop;
  verifier: VerificationLoop;
  eventDriver: EventDriver;
  engine: EngineAnalysisLoop;
  state: HarnessState | null = null;
  private mode = "run";
  session: SessionMemory;
  private sessionId?: string;
  private loopTimer: Timer | null = null;
  private featureTimings: FeatureTiming[] = [];

  constructor(config: Config) {
    this.config = config;
    this.agentMode = config.agentMode as AgentMode;
    this.managers = new ManagerRegistry(config);
    this.llm = new LLMClient(config);
    if (this.agentMode === "bypass") {
      this.config.autoApprove = true;
      this.managers.permissions.autoApprove = true;
    }
    this.tools = new ToolRegistry(
      config,
      this.managers.project,
      this.managers.permissions,
      this.agentMode,
      this.managers.memory,
    );
    this.agent = new AgentLoop(config, this.managers, this.llm, this.tools, this.agentMode);
    this.verifier = new VerificationLoop(config, this.managers, this.llm, this.tools);
    this.eventDriver = new EventDriver(config, this.managers, this.llm);
    this.engine = new EngineAnalysisLoop(config, this.managers, this.llm);
    this.session = this.managers.memory.createSession(this.sessionId);
    this.managers.status.clear();
    this.init();
  }

  private async init(): Promise<void> {
    await this.injectProjectMemory();
  }

  setSessionId(id: string): void {
    this.sessionId = id;
    this.session = this.managers.memory.createSession(id);
  }

  private async injectProjectMemory(): Promise<void> {
    const projectCtx = await this.managers.memory.project.getContextForPrompt();
    if (projectCtx && !this.agent.systemPrompt.includes(projectCtx)) {
      this.agent.systemPrompt += `\n\nProject memory:\n${projectCtx}`;
    }
  }

  private async writeStatus(
    loop: string,
    phase: string,
    feature = "",
    extra: Record<string, unknown> = {},
  ): Promise<void> {
    await this.managers.status.write({
      loop,
      phase,
      feature,
      mode: this.mode,
      agent_mode: this.agentMode,
      ...extra,
    });
  }

  async initialize(): Promise<void> {
    this.state = await this.managers.state.load();
    if (this.state === null) {
      this.state = new HarnessState();
      this.state.features = await this.eventDriver.generateEventsFromAdr(this.state);
      this.state.systemPrompt = this.agent.systemPrompt;
      await this.managers.state.save(this.state);
      console.log(`[spiral] Initialized with ${this.state.features.length} features from ADR`);
    } else {
      console.log(
        `[spiral] Resumed: ${this.state.completedFeatures.length} done, ` +
          `${this.state.failedFeatures.length} failed, ` +
          `${this.state.features.length - this.state.currentFeatureIndex} remaining`,
      );
    }
    await this.session.saveContext({
      mode: this.mode,
      started: new Date().toISOString(),
      model: this.config.model,
      agent_mode: this.agentMode,
    });
    await this.session.saveState(this.state.toDict());
  }

  async run(): Promise<void> {
    await this.initialize();
    this.loopTimer = Timer.start();
    this.featureTimings = [];

    while (this.eventDriver.hasMoreWork(this.state!)) {
      const feature = this.eventDriver.getNextFeature(this.state!);
      if (!feature) break;

      console.log(`\n${"=".repeat(60)}`);
      console.log(`[spiral] FEATURE: ${feature.name}`);
      console.log(`[spiral] Section: ${feature.adrSection}`);
      console.log(`[spiral] Attempt: ${feature.implementationAttempts + 1}`);
      console.log("=".repeat(60));

      const featTimer = Timer.start();
      this.state!.totalAgentIterations++;

      await this.writeStatus("agent", "start", feature.name, {
        attempt: feature.implementationAttempts + 1,
      });
      const agentOutput = await this.agent.run(feature, this.state!.systemPrompt || undefined);
      const agentMs = featTimer.lap("agent");

      this.state!.totalVerificationRuns++;
      await this.writeStatus("verifier", "grading", feature.name);
      const [passed, grade] = await this.verifier.run(feature, agentOutput);
      const verifierMs = featTimer.lap("verifier") - agentMs;

      if (passed) {
        console.log(`[spiral] PASSED (score: ${grade.score.toFixed(2)})`);
        await this.eventDriver.onFeatureComplete(this.state!, feature);
        await this.session.archiveFeature(feature.name);
      } else {
        console.log(`[spiral] FAILED (score: ${grade.score.toFixed(2)})`);
        console.log(`[spiral] Feedback: ${grade.feedback.slice(0, 200)}`);
        await this.eventDriver.onFeatureFailed(this.state!, feature);
        await this.managers.memory.project.addFailure({
          feature: feature.name,
          feedback: grade.feedback.slice(0, 500),
          attempts: feature.implementationAttempts,
        });
      }

      let engineMs = 0;
      if (this.engine.shouldAnalyze(this.state!)) {
        console.log("\n[spiral] ENGINE ANALYSIS...");
        await this.writeStatus("engine", "analyzing", "*");
        const improvements = await this.engine.analyze(this.state!);
        for (const imp of improvements) console.log(`  [engine] ${imp}`);
        engineMs = featTimer.lap("engine") - agentMs - verifierMs;
      }

      const totalMs = featTimer.elapsedMs();
      this.featureTimings.push({
        featureName: feature.name,
        agentMs,
        verifierMs,
        engineMs,
        totalMs,
        passed,
      });
      console.log(
        `[spiral] Time: ${Timer.format(totalMs)} (agent ${Timer.format(agentMs)}, verifier ${Timer.format(verifierMs)})`,
      );

      await this.managers.state.save(this.state!);
      await this.session.saveState(this.state!.toDict());
    }

    const totalMs = this.loopTimer.elapsedMs();
    console.log(`\n${"=".repeat(60)}`);
    console.log("[spiral] WORK COMPLETE");
    console.log(`  Completed: ${this.state!.completedFeatures.length}`);
    console.log(`  Failed: ${this.state!.failedFeatures.length}`);
    console.log(`  Agent iterations: ${this.state!.totalAgentIterations}`);
    console.log(`  Verification runs: ${this.state!.totalVerificationRuns}`);
    console.log(`  Engine analyses: ${this.state!.totalEngineAnalyses}`);
    console.log(`  Harness improvements: ${this.state!.harnessImprovements.length}`);
    this.printTimingSummary(totalMs);
    console.log("=".repeat(60));
    await this.writeStatus("harness", "idle", "*", { total_elapsed_ms: totalMs });
  }

  getLoopTiming(): LoopTiming | null {
    if (!this.loopTimer) return null;
    const totalMs = this.loopTimer.elapsedMs();
    const avg =
      this.featureTimings.length > 0
        ? this.featureTimings.reduce((s, t) => s + t.totalMs, 0) / this.featureTimings.length
        : 0;
    const times = this.featureTimings.map((t) => t.totalMs);
    return {
      startedAt: new Date(Date.now() - totalMs).toISOString(),
      endedAt: new Date().toISOString(),
      totalMs,
      features: [...this.featureTimings],
      avgFeatureMs: avg,
      fastestMs: times.length > 0 ? Math.min(...times) : 0,
      slowestMs: times.length > 0 ? Math.max(...times) : 0,
    };
  }

  private printTimingSummary(totalMs: number): void {
    console.log("\n  ── Timing Summary ──");
    console.log(`  Total elapsed:    ${Timer.format(totalMs)}`);
    if (this.featureTimings.length > 0) {
      const avg = totalMs / this.featureTimings.length;
      const fastest = this.featureTimings.reduce((a, b) => (a.totalMs < b.totalMs ? a : b));
      const slowest = this.featureTimings.reduce((a, b) => (a.totalMs > b.totalMs ? a : b));
      console.log(`  Features timed:   ${this.featureTimings.length}`);
      console.log(`  Avg per feature:  ${Timer.format(avg)}`);
      console.log(`  Fastest:          ${Timer.format(fastest.totalMs)} (${fastest.featureName})`);
      console.log(`  Slowest:          ${Timer.format(slowest.totalMs)} (${slowest.featureName})`);
      const totalAgent = this.featureTimings.reduce((s, t) => s + t.agentMs, 0);
      const totalVerifier = this.featureTimings.reduce((s, t) => s + t.verifierMs, 0);
      const totalEngine = this.featureTimings.reduce((s, t) => s + t.engineMs, 0);
      console.log(
        `  Agent total:      ${Timer.format(totalAgent)} (${Math.round((totalAgent / totalMs) * 100)}%)`,
      );
      console.log(
        `  Verifier total:   ${Timer.format(totalVerifier)} (${Math.round((totalVerifier / totalMs) * 100)}%)`,
      );
      console.log(
        `  Engine total:     ${Timer.format(totalEngine)} (${Math.round((totalEngine / totalMs) * 100)}%)`,
      );
    }
  }

  async runForever(): Promise<void> {
    this.mode = "forever";
    await this.initialize();
    let cycle = 0;

    while (true) {
      cycle++;
      console.log(`\n[spiral] CYCLE ${cycle}`);

      if (this.eventDriver.hasMoreWork(this.state!)) {
        await this.processNextFeature();
      } else {
        console.log("[spiral] All features done. Regenerating from ADR...");
        await this.writeStatus("event", "regenerating", "*");
        const newFeatures = await this.eventDriver.generateEventsFromAdr(this.state!);
        const existing = new Set(this.state!.features.map((f) => f.name));
        const fresh = newFeatures.filter((f) => !existing.has(f.name));
        if (fresh.length > 0) {
          this.state!.features.push(...fresh);
          console.log(`[spiral] Added ${fresh.length} new features`);
        } else {
          console.log("[spiral] No new features. Running engine analysis...");
          await this.engine.analyze(this.state!);
        }
      }

      await this.managers.state.save(this.state!);
      await this.session.saveState(this.state!.toDict());
    }
  }

  private async processNextFeature(): Promise<void> {
    const feature = this.eventDriver.getNextFeature(this.state!);
    if (!feature) return;

    console.log(`\n[spiral] FEATURE: ${feature.name}`);
    const featTimer = Timer.start();
    this.state!.totalAgentIterations++;

    await this.writeStatus("agent", "start", feature.name, {
      attempt: feature.implementationAttempts + 1,
    });
    const agentOutput = await this.agent.run(feature, this.state!.systemPrompt || undefined);
    const agentMs = featTimer.lap("agent");

    this.state!.totalVerificationRuns++;
    await this.writeStatus("verifier", "grading", feature.name);
    const [passed, grade] = await this.verifier.run(feature, agentOutput);
    const verifierMs = featTimer.lap("verifier") - agentMs;

    if (passed) {
      console.log(`[spiral] PASSED (${grade.score.toFixed(2)})`);
      await this.eventDriver.onFeatureComplete(this.state!, feature);
      await this.session.archiveFeature(feature.name);
    } else {
      console.log(`[spiral] FAILED (${grade.score.toFixed(2)})`);
      await this.eventDriver.onFeatureFailed(this.state!, feature);
    }

    let engineMs = 0;
    if (this.engine.shouldAnalyze(this.state!)) {
      await this.writeStatus("engine", "analyzing", "*");
      await this.engine.analyze(this.state!);
      engineMs = featTimer.lap("engine") - agentMs - verifierMs;
    }

    const totalMs = featTimer.elapsedMs();
    this.featureTimings.push({
      featureName: feature.name,
      agentMs,
      verifierMs,
      engineMs,
      totalMs,
      passed,
    });
    console.log(
      `[spiral] Time: ${Timer.format(totalMs)} (agent ${Timer.format(agentMs)}, verifier ${Timer.format(verifierMs)})`,
    );
  }
}
