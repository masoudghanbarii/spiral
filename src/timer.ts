export class Timer {
  private startMs: number;
  private laps: Map<string, number> = new Map();

  constructor() {
    this.startMs = Date.now();
  }

  static start(): Timer {
    return new Timer();
  }

  lap(name: string): number {
    const now = Date.now();
    const elapsed = now - this.startMs;
    this.laps.set(name, elapsed);
    return elapsed;
  }

  getLap(name: string): number | undefined {
    return this.laps.get(name);
  }

  elapsedMs(): number {
    return Date.now() - this.startMs;
  }

  reset(): void {
    this.startMs = Date.now();
    this.laps.clear();
  }

  static format(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    const remS = Math.floor(s % 60);
    if (m < 60) return `${m}m ${remS}s`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m`;
  }
}

export interface FeatureTiming {
  featureName: string;
  agentMs: number;
  verifierMs: number;
  engineMs: number;
  totalMs: number;
  passed: boolean;
}

export interface LoopTiming {
  startedAt: string;
  endedAt: string;
  totalMs: number;
  features: FeatureTiming[];
  avgFeatureMs: number;
  fastestMs: number;
  slowestMs: number;
}
