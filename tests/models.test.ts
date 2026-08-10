import { describe, it, expect } from "vitest";
import { Feature, HarnessState, TraceEntry, GradingResult } from "../src/models.js";

describe("Feature", () => {
  it("creates with defaults", () => {
    const f = new Feature();
    expect(f.name).toBe("");
    expect(f.status).toBe("pending");
    expect(f.implementationAttempts).toBe(0);
  });

  it("roundtrips through toDict/fromDict", () => {
    const f = new Feature({ name: "auth", description: "login", adr_section: "Auth" });
    const d = f.toDict();
    const f2 = Feature.fromDict(d);
    expect(f2.name).toBe("auth");
    expect(f2.adrSection).toBe("Auth");
  });
});

describe("HarnessState", () => {
  it("roundtrips through toDict/fromDict", () => {
    const s = new HarnessState();
    s.features = [new Feature({ name: "f1" }), new Feature({ name: "f2" })];
    s.completedFeatures = ["f1"];
    const d = s.toDict();
    const s2 = HarnessState.fromDict(d);
    expect(s2.features.length).toBe(2);
    expect(s2.completedFeatures).toEqual(["f1"]);
  });
});

describe("TraceEntry", () => {
  it("roundtrips through toDict/fromDict", () => {
    const t = new TraceEntry({
      event_type: "agent_step",
      loop_name: "test",
      feature: "f1",
      data: { key: "val" },
    });
    const d = t.toDict();
    const t2 = TraceEntry.fromDict(d);
    expect(t2.eventType).toBe("agent_step");
    expect(t2.feature).toBe("f1");
  });
});

describe("GradingResult", () => {
  it("creates with defaults", () => {
    const g = new GradingResult();
    expect(g.status).toBe("error");
    expect(g.score).toBe(0);
  });

  it("toDict preserves data", () => {
    const g = new GradingResult({ status: "pass", score: 0.95, feedback: "good" });
    const d = g.toDict();
    expect(d.status).toBe("pass");
    expect(d.score).toBe(0.95);
  });
});
