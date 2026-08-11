import { Config } from "./config.js";
import { createProvider, type ILLMProvider } from "./providers.js";
import type { ChatMessage, LLMResponse, ToolDefinition } from "./types.js";

const PROVIDER_BASE_URLS: Record<string, string> = {
  ollama: "http://localhost:11434",
  anthropic: "https://api.anthropic.com",
  openai: "https://api.openai.com",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  xai: "https://api.x.ai/v1",
  mistral: "https://api.mistral.ai/v1",
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  deepseek: "https://api.deepseek.com/v1",
  together: "https://api.together.xyz/v1",
};

export class LLMClient {
  private provider: ILLMProvider;

  constructor(config: Config) {
    const baseUrl = PROVIDER_BASE_URLS[config.llmProvider] ?? config.ollamaBaseUrl;
    this.provider = createProvider(config.llmProvider, {
      baseUrl,
      apiKey: config.ollamaApiKey,
      model: config.model,
    });
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<LLMResponse> {
    return this.provider.chat(messages, tools);
  }

  async generate(prompt: string, system?: string): Promise<string> {
    return this.provider.generate(prompt, system);
  }

  async chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    callback?: (chunk: string) => void,
  ): Promise<LLMResponse> {
    return this.provider.chatStream(messages, tools, callback);
  }

  extractJson(text: string): unknown | null {
    return this.provider.extractJson(text);
  }
}
