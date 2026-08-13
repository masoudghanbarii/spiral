import { describe, it, expect } from "vitest";
import {
  parseSlashCommand,
  getHelpText,
  getAvailableModes,
  isValidMode,
  shouldForceClearOnOverlayClose,
} from "../src/tui/commands.js";

describe("parseSlashCommand", () => {
  it("parses /help", () => {
    const result = parseSlashCommand("/help");
    expect(result).not.toBeNull();
    expect(result!.command).toBe("help");
  });

  it("parses /exit", () => {
    const result = parseSlashCommand("/exit");
    expect(result!.command).toBe("exit");
  });

  it("parses /quit as exit", () => {
    const result = parseSlashCommand("/quit");
    expect(result!.command).toBe("exit");
  });

  it("parses /mode with args", () => {
    const result = parseSlashCommand("/mode plan");
    expect(result!.command).toBe("mode");
    expect(result!.args).toBe("plan");
  });

  it("parses /model with args", () => {
    const result = parseSlashCommand("/model gpt-4");
    expect(result!.command).toBe("model");
    expect(result!.args).toBe("gpt-4");
  });

  it("returns null for non-slash input", () => {
    expect(parseSlashCommand("hello world")).toBeNull();
  });

  it("returns unknown for unrecognized command", () => {
    const result = parseSlashCommand("/foobar");
    expect(result!.command).toBe("unknown");
  });

  it("parses /clear", () => {
    expect(parseSlashCommand("/clear")!.command).toBe("clear");
  });

  it("parses /sessions", () => {
    expect(parseSlashCommand("/sessions")!.command).toBe("sessions");
  });

  it("parses /session as sessions alias", () => {
    expect(parseSlashCommand("/session main")!.command).toBe("sessions");
  });

  it("parses /abort", () => {
    expect(parseSlashCommand("/abort")!.command).toBe("abort");
  });

  it("parses /new", () => {
    expect(parseSlashCommand("/new")!.command).toBe("new");
  });

  it("preserves raw input", () => {
    const result = parseSlashCommand("/mode plan");
    expect(result!.raw).toBe("/mode plan");
  });
});

describe("getHelpText", () => {
  it("contains help text", () => {
    const text = getHelpText();
    expect(text).toContain("/help");
    expect(text).toContain("/exit");
    expect(text).toContain("Keyboard");
  });
});

describe("isValidMode", () => {
  it("valid modes", () => {
    expect(isValidMode("normal")).toBe(true);
    expect(isValidMode("plan")).toBe(true);
    expect(isValidMode("bypass")).toBe(true);
    expect(isValidMode("safe")).toBe(true);
    expect(isValidMode("interactive")).toBe(true);
  });

  it("invalid mode", () => {
    expect(isValidMode("fast")).toBe(false);
  });
});

describe("getAvailableModes", () => {
  it("returns all 6 modes", () => {
    const modes = getAvailableModes();
    expect(modes).toHaveLength(6); expect(modes).toContain("loop");
    expect(modes).toContain("normal");
  });
});

describe("shouldForceClearOnOverlayClose", () => {
  it("forces clear when an overlay closes", () => {
    expect(shouldForceClearOnOverlayClose("mode", null)).toBe(true);
    expect(shouldForceClearOnOverlayClose("session", null)).toBe(true);
    expect(shouldForceClearOnOverlayClose("agentplan", null)).toBe(true);
  });

  it("does not clear when no overlay was open", () => {
    expect(shouldForceClearOnOverlayClose(null, null)).toBe(false);
  });

  it("does not clear when opening or switching overlays", () => {
    expect(shouldForceClearOnOverlayClose(null, "mode")).toBe(false);
    expect(shouldForceClearOnOverlayClose("mode", "session")).toBe(false);
    expect(shouldForceClearOnOverlayClose("mode", "mode")).toBe(false);
  });

  it("does not clear when an overlay stays open", () => {
    expect(shouldForceClearOnOverlayClose("session", "session")).toBe(false);
  });
});
