import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  OllamaProvider,
  AnthropicProvider,
  OpenAIProvider,
  GeminiProvider,
  XAIProvider,
} from "../src/providers.js";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    headers: { get: () => "application/json" },
    body: null,
  } as unknown as Response;
}

function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const reader = {
    read: async () => {
      if (chunks.length === 0) return { done: true, value: undefined };
      return { done: false, value: encoder.encode(chunks.shift()) };
    },
  };
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({}),
    text: async () => "",
    headers: { get: () => "text/event-stream" },
    body: { getReader: () => reader },
  } as unknown as Response;
}

describe("OllamaProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("chat returns LLMResponse", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: { content: "hi" } })));
    const p = new OllamaProvider({ baseUrl: "http://localhost:11434", apiKey: "k", model: "m" });
    const r = await p.chat([{ role: "user", content: "x" }]);
    expect(r.message.content).toBe("hi");
  });

  it("chat throws on non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse("err", false, 500)));
    const p = new OllamaProvider({ baseUrl: "http://localhost:11434", apiKey: "k", model: "m" });
    await expect(p.chat([{ role: "user", content: "x" }])).rejects.toThrow("Ollama chat 500");
  });

  it("generate returns response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ response: "hello" })));
    const p = new OllamaProvider({ baseUrl: "http://localhost:11434", apiKey: "k", model: "m" });
    expect(await p.generate("hi")).toBe("hello");
  });

  it("generate throws on non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse("err", false, 500)));
    const p = new OllamaProvider({ baseUrl: "http://localhost:11434", apiKey: "k", model: "m" });
    await expect(p.generate("hi")).rejects.toThrow("Ollama generate 500");
  });

  it("chatStream streams content", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          streamResponse([
            '{"message":{"content":"He"}}\n',
            '{"message":{"content":"llo"}}\n',
            '{"done":true}\n',
          ]),
        ),
    );
    const p = new OllamaProvider({ baseUrl: "http://localhost:11434", apiKey: "k", model: "m" });
    const chunks: string[] = [];
    const r = await p.chatStream([{ role: "user", content: "x" }], undefined, (c) =>
      chunks.push(c),
    );
    expect(r.message.content).toBe("Hello");
    expect(chunks).toEqual(["He", "llo"]);
  });

  it("chatStream throws on non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse("err", false, 500)));
    const p = new OllamaProvider({ baseUrl: "http://localhost:11434", apiKey: "k", model: "m" });
    await expect(p.chatStream([{ role: "user", content: "x" }])).rejects.toThrow(
      "Ollama stream 500",
    );
  });
});

describe("AnthropicProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("chat splits system message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ content: [{ type: "text", text: "answer" }] })),
    );
    const p = new AnthropicProvider({ baseUrl: "", apiKey: "k", model: "claude" });
    const r = await p.chat([
      { role: "system", content: "sys" },
      { role: "user", content: "q" },
    ]);
    expect(r.message.content).toBe("answer");
  });

  it("chat throws on non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse("err", false, 400)));
    const p = new AnthropicProvider({ baseUrl: "", apiKey: "k", model: "claude" });
    await expect(p.chat([{ role: "user", content: "q" }])).rejects.toThrow("Anthropic 400");
  });

  it("generate returns content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ content: [{ type: "text", text: "gen" }] })),
    );
    const p = new AnthropicProvider({ baseUrl: "", apiKey: "k", model: "claude" });
    expect(await p.generate("hi", "system")).toBe("gen");
  });
});

describe("OpenAIProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("chat returns message", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ choices: [{ message: { content: "hi", tool_calls: [] } }] }),
        ),
    );
    const p = new OpenAIProvider({ baseUrl: "http://localhost", apiKey: "k", model: "gpt" });
    const r = await p.chat([{ role: "user", content: "x" }]);
    expect(r.message.content).toBe("hi");
  });

  it("chat throws on non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse("err", false, 401)));
    const p = new OpenAIProvider({ baseUrl: "http://localhost", apiKey: "k", model: "gpt" });
    await expect(p.chat([{ role: "user", content: "x" }])).rejects.toThrow("OpenAI 401");
  });

  it("chatStream returns chat when no callback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ choices: [{ message: { content: "hi" } }] })),
    );
    const p = new OpenAIProvider({ baseUrl: "http://localhost", apiKey: "k", model: "gpt" });
    const r = await p.chatStream([{ role: "user", content: "x" }]);
    expect(r.message.content).toBe("hi");
  });

  it("chatStream streams with callback", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          streamResponse([
            'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":" there"}}]}\n\n',
            "data: [DONE]\n\n",
          ]),
        ),
    );
    const p = new OpenAIProvider({ baseUrl: "http://localhost", apiKey: "k", model: "gpt" });
    const chunks: string[] = [];
    const r = await p.chatStream([{ role: "user", content: "x" }], undefined, (c) =>
      chunks.push(c),
    );
    expect(r.message.content).toBe("Hi there");
    expect(chunks).toEqual(["Hi", " there"]);
  });
});

describe("GeminiProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("chat returns content", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ candidates: [{ content: { parts: [{ text: "gem" }] } }] }),
        ),
    );
    const p = new GeminiProvider({ baseUrl: "", apiKey: "k", model: "gemini" });
    const r = await p.chat([
      { role: "system", content: "sys" },
      { role: "user", content: "q" },
    ]);
    expect(r.message.content).toBe("gem");
  });

  it("chat throws on non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse("err", false, 500)));
    const p = new GeminiProvider({ baseUrl: "", apiKey: "k", model: "gemini" });
    await expect(p.chat([{ role: "user", content: "q" }])).rejects.toThrow("Gemini 500");
  });

  it("chatStream streams with callback", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          streamResponse([
            'data: {"candidates":[{"content":{"parts":[{"text":"A"}]}}]}\n\n',
            'data: {"candidates":[{"content":{"parts":[{"text":"B"}]}}]}\n\n',
          ]),
        ),
    );
    const p = new GeminiProvider({ baseUrl: "", apiKey: "k", model: "gemini" });
    const chunks: string[] = [];
    const r = await p.chatStream([{ role: "user", content: "q" }], undefined, (c) =>
      chunks.push(c),
    );
    expect(r.message.content).toBe("AB");
    expect(chunks).toEqual(["A", "B"]);
  });
});

describe("XAIProvider", () => {
  it("defaults model and baseUrl", () => {
    const p = new XAIProvider({ baseUrl: "", apiKey: "k", model: "" });
    expect((p as unknown as { model: string }).model).toBe("grok-3");
    expect((p as unknown as { baseUrl: string }).baseUrl).toBe("https://api.x.ai/v1");
  });
});
