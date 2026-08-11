import { describe, it, expect } from "vitest";
import {
  createProvider,
  OllamaProvider,
  AnthropicProvider,
  OpenAIProvider,
  GeminiProvider,
  XAIProvider,
  MistralProvider,
  GroqProvider,
  OpenRouterProvider,
  DeepSeekProvider,
  TogetherProvider,
  extractJsonFromText,
  stripCodeFences,
} from "../src/providers.js";

describe("createProvider", () => {
  const config = { baseUrl: "http://localhost:11434", apiKey: "test", model: "test" };

  it("creates ollama by default", () => {
    expect(createProvider("ollama", config)).toBeInstanceOf(OllamaProvider);
  });

  it("creates anthropic", () => {
    expect(createProvider("anthropic", config)).toBeInstanceOf(AnthropicProvider);
  });

  it("creates openai", () => {
    expect(createProvider("openai", config)).toBeInstanceOf(OpenAIProvider);
  });

  it("creates gemini", () => {
    expect(createProvider("gemini", config)).toBeInstanceOf(GeminiProvider);
  });

  it("creates xai", () => {
    expect(createProvider("xai", config)).toBeInstanceOf(XAIProvider);
  });

  it("creates mistral", () => {
    expect(createProvider("mistral", config)).toBeInstanceOf(MistralProvider);
  });

  it("creates groq", () => {
    expect(createProvider("groq", config)).toBeInstanceOf(GroqProvider);
  });

  it("creates openrouter", () => {
    expect(createProvider("openrouter", config)).toBeInstanceOf(OpenRouterProvider);
  });

  it("creates deepseek", () => {
    expect(createProvider("deepseek", config)).toBeInstanceOf(DeepSeekProvider);
  });

  it("creates together", () => {
    expect(createProvider("together", config)).toBeInstanceOf(TogetherProvider);
  });

  it("falls back to ollama for unknown", () => {
    expect(createProvider("unknown", config)).toBeInstanceOf(OllamaProvider);
  });
});

describe("Provider extractJson", () => {
  const providers = [
    new OllamaProvider({ baseUrl: "", apiKey: "", model: "" }),
    new AnthropicProvider({ baseUrl: "", apiKey: "", model: "" }),
    new OpenAIProvider({ baseUrl: "", apiKey: "", model: "" }),
    new GeminiProvider({ baseUrl: "", apiKey: "", model: "" }),
  ];

  for (const p of providers) {
    it(`${p.constructor.name} extracts JSON array`, () => {
      expect(p.extractJson('prefix [{"a":1}] suffix')).toEqual([{ a: 1 }]);
    });
  }
});

describe("stripCodeFences", () => {
  it("strips json fences", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("strips plain fences", () => {
    expect(stripCodeFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("no fences returns trimmed", () => {
    expect(stripCodeFences('{"a":1}')).toBe('{"a":1}');
  });
});

describe("extractJsonFromText", () => {
  it("extracts array", () => {
    expect(extractJsonFromText('text [{"x":1}] text')).toEqual([{ x: 1 }]);
  });

  it("extracts object", () => {
    expect(extractJsonFromText('text {"y":2} text')).toEqual({ y: 2 });
  });

  it("returns null for no json", () => {
    expect(extractJsonFromText("nothing here")).toBeNull();
  });
});
