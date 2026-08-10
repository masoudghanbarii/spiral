import { describe, it, expect } from "vitest";
import { Timer } from "../src/timer.js";

describe("Timer", () => {
  it("starts and measures elapsed", () => {
    const t = Timer.start();
    const ms = t.elapsedMs();
    expect(ms).toBeGreaterThanOrEqual(0);
  });

  it("lap records time", () => {
    const t = Timer.start();
    const ms = t.lap("test");
    expect(ms).toBeGreaterThanOrEqual(0);
    expect(t.getLap("test")).toBe(ms);
  });

  it("reset clears laps", () => {
    const t = Timer.start();
    t.lap("a");
    t.reset();
    expect(t.getLap("a")).toBeUndefined();
  });

  it("format milliseconds", () => {
    expect(Timer.format(500)).toBe("500ms");
  });

  it("format seconds", () => {
    expect(Timer.format(1500)).toBe("1.5s");
  });

  it("format minutes", () => {
    expect(Timer.format(65_000)).toBe("1m 5s");
  });

  it("format hours", () => {
    expect(Timer.format(3_665_000)).toBe("1h 1m");
  });

  it("multiple laps accumulate", () => {
    const t = Timer.start();
    const first = t.lap("first");
    const second = t.lap("second");
    expect(second).toBeGreaterThanOrEqual(first);
  });
});
