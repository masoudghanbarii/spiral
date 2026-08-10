import type { ChatMessage, LLMResponse, ToolDefinition, ToolCall } from "./types.js";

export interface ILLMProvider {
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<LLMResponse>;
  generate(prompt: string, system?: string): Promise<string>;
  chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    callback?: (chunk: string) => void,
  ): Promise<LLMResponse>;
  extractJson(text: string): unknown | null;
}

export function createProvider(
  provider: string,
  config: { baseUrl: string; apiKey: string; model: string },
): ILLMProvider {
  if (provider === "anthropic") return new AnthropicProvider(config);
  if (provider === "openai") return new OpenAIProvider(config);
  return new OllamaProvider(config);
}

export function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  cleaned = cleaned.replace(/```$/, "");
  return cleaned.trim();
}

export function extractJsonFromText(text: string): unknown | null {
  const cleaned = stripCodeFences(text);
  try {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]") + 1;
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end));
  } catch {
    // try object
  }
  try {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}") + 1;
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end));
  } catch {
    return null;
  }
  return null;
}

export class OllamaProvider implements ILLMProvider {
  private baseUrl: string;
  private model: string;
  private headers: Record<string, string>;

  constructor(config: { baseUrl: string; apiKey: string; model: string }) {
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.headers = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const payload: Record<string, unknown> = { model: this.model, messages, stream: false };
    if (tools) payload.tools = tools;
    const resp = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`Ollama chat ${resp.status}: ${await resp.text()}`);
    return (await resp.json()) as LLMResponse;
  }

  async generate(prompt: string, system = ""): Promise<string> {
    const payload = { model: this.model, prompt, system, stream: false };
    const resp = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`Ollama generate ${resp.status}: ${await resp.text()}`);
    const data = (await resp.json()) as { response?: string };
    return data.response ?? "";
  }

  async chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    callback?: (chunk: string) => void,
  ): Promise<LLMResponse> {
    const payload: Record<string, unknown> = { model: this.model, messages, stream: true };
    if (tools) payload.tools = tools;
    const resp = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`Ollama stream ${resp.status}: ${await resp.text()}`);
    let fullContent = "";
    const fullMsg: { content: string; tool_calls?: unknown[] } = { content: "", tool_calls: [] };
    const reader = resp.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line) as {
            message?: { content?: string; tool_calls?: unknown[] };
            done?: boolean;
          };
          const content = chunk.message?.content ?? "";
          if (content) {
            fullContent += content;
            fullMsg.content = fullContent;
            callback?.(content);
          }
          if (chunk.message?.tool_calls) fullMsg.tool_calls = chunk.message.tool_calls;
          if (chunk.done) break;
        } catch {
          continue;
        }
      }
    }
    return { message: fullMsg } as LLMResponse;
  }

  extractJson(text: string): unknown | null {
    return extractJsonFromText(text);
  }
}

export class AnthropicProvider implements ILLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://api.anthropic.com";

  constructor(config: { baseUrl: string; apiKey: string; model: string }) {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? config.apiKey;
    this.model = config.model;
  }

  async chat(messages: ChatMessage[], _tools?: ToolDefinition[]): Promise<LLMResponse> {
    let system = "";
    const chatMsgs: { role: string; content: string }[] = [];
    for (const m of messages) {
      if (m.role === "system") system += m.content + "\n";
      else chatMsgs.push({ role: m.role, content: m.content });
    }
    const payload = {
      model: this.model,
      max_tokens: 4096,
      messages: chatMsgs,
      system,
    };
    const resp = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
    const data = (await resp.json()) as { content?: { type: string; text?: string }[] };
    let content = "";
    for (const block of data.content ?? []) {
      if (block.type === "text") content += block.text ?? "";
    }
    return { message: { content, tool_calls: [] } };
  }

  async generate(prompt: string, system = ""): Promise<string> {
    const messages = system
      ? [
          { role: "system" as const, content: system },
          { role: "user" as const, content: prompt },
        ]
      : [{ role: "user" as const, content: prompt }];
    const result = await this.chat(messages);
    return result.message.content;
  }

  async chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    _callback?: (chunk: string) => void,
  ): Promise<LLMResponse> {
    return this.chat(messages, tools);
  }

  extractJson(text: string): unknown | null {
    return extractJsonFromText(text);
  }
}

export class OpenAIProvider implements ILLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: { baseUrl: string; apiKey: string; model: string }) {
    this.apiKey = process.env.OPENAI_API_KEY ?? config.apiKey;
    this.model = config.model;
    this.baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com";
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    const payload: Record<string, unknown> = { model: this.model, messages };
    if (tools) {
      payload.tools = tools.map((t) => ({ type: "function", function: t.function }));
    }
    const resp = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
    const data = (await resp.json()) as {
      choices?: { message?: { content?: string; tool_calls?: unknown[] } }[];
    };
    const choice = data.choices?.[0];
    const msg = choice?.message ?? {};
    return {
      message: { content: msg.content ?? "", tool_calls: msg.tool_calls as ToolCall[] | undefined },
    };
  }

  async generate(prompt: string, system = ""): Promise<string> {
    const messages = system
      ? [
          { role: "system" as const, content: system },
          { role: "user" as const, content: prompt },
        ]
      : [{ role: "user" as const, content: prompt }];
    const result = await this.chat(messages);
    return result.message.content;
  }

  async chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    _callback?: (chunk: string) => void,
  ): Promise<LLMResponse> {
    return this.chat(messages, tools);
  }

  extractJson(text: string): unknown | null {
    return extractJsonFromText(text);
  }
}
