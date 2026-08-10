import { Config } from "./config.js";
import { createProvider, type ILLMProvider } from "./providers.js";
import type { ChatMessage, LLMResponse, ToolDefinition } from "./types.js";

export class LLMClient {
  private provider: ILLMProvider;

  constructor(config: Config) {
    this.provider = createProvider(config.llmProvider, {
      baseUrl: config.ollamaBaseUrl,
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
