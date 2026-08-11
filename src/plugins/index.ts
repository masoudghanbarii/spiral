import type { Config } from "../config.js";
import type { ProjectManager } from "../managers/project.js";
import type { MemoryManager } from "../managers/memory.js";
import type { ToolDefinition } from "../types.js";

export interface PluginCommand {
  name: string;
  description: string;
  execute: (args: string) => Promise<string>;
}

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  init?(context: PluginContext): void;
  tools?: ToolDefinition[];
  commands?: PluginCommand[];
}

export interface PluginContext {
  config: Config;
  project: ProjectManager;
  memory: MemoryManager;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }
    this.plugins.set(plugin.name, plugin);
    if (plugin.init) {
      plugin.init(this.context);
    }
  }

  unregister(name: string): void {
    this.plugins.delete(name);
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getTools(): ToolDefinition[] {
    const tools: ToolDefinition[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.tools) {
        tools.push(...plugin.tools);
      }
    }
    return tools;
  }

  getCommands(): PluginCommand[] {
    const commands: PluginCommand[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.commands) {
        commands.push(...plugin.commands);
      }
    }
    return commands;
  }
}