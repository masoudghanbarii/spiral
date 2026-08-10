import { describe, it, expect } from "vitest";
import { getDisabledTools, getSystemPromptSuffix } from "../src/modes.js";

describe("getDisabledTools", () => {
  it("normal mode disables nothing", () => {
    expect(getDisabledTools("normal").size).toBe(0);
  });

  it("plan mode disables writes", () => {
    const d = getDisabledTools("plan");
    expect(d.has("write_file")).toBe(true);
    expect(d.has("edit_file")).toBe(true);
    expect(d.has("run_command")).toBe(true);
    expect(d.has("git_commit")).toBe(true);
  });

  it("plan mode allows reads", () => {
    const d = getDisabledTools("plan");
    expect(d.has("read_file")).toBe(false);
    expect(d.has("grep")).toBe(false);
  });

  it("safe mode disables more than plan", () => {
    const plan = getDisabledTools("plan");
    const safe = getDisabledTools("safe");
    expect(safe.size).toBeGreaterThan(plan.size);
    expect(safe.has("run_tests")).toBe(true);
  });

  it("bypass disables nothing", () => {
    expect(getDisabledTools("bypass").size).toBe(0);
  });
});

describe("getSystemPromptSuffix", () => {
  it("normal is empty", () => {
    expect(getSystemPromptSuffix("normal")).toBe("");
  });

  it("plan has instruction", () => {
    const s = getSystemPromptSuffix("plan");
    expect(s).toContain("PLAN MODE");
  });

  it("safe has instruction", () => {
    const s = getSystemPromptSuffix("safe");
    expect(s).toContain("SAFE MODE");
  });
});
