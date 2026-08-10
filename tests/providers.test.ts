import { describe, it, expect } from "vitest";
import { extractJsonFromText, stripCodeFences } from "../src/providers.js";

describe("extractJsonFromText", () => {
  it("extracts JSON array", () => {
    expect(extractJsonFromText('prefix [{"a": 1}] suffix')).toEqual([{ a: 1 }]);
  });

  it("extracts JSON object", () => {
    expect(extractJsonFromText('prefix {"a": 1} suffix')).toEqual({ a: 1 });
  });

  it("returns null for no JSON", () => {
    expect(extractJsonFromText("no json here")).toBeNull();
  });

  it("strips code fences", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("extracts from code-fenced JSON", () => {
    expect(extractJsonFromText('```json\n[{"name": "test"}]\n```')).toEqual([{ name: "test" }]);
  });
});
