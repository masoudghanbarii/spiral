import { spawn, ChildProcess } from "node:child_process";

export interface MCPServerConfig {
  name: string;
  transport: "stdio" | "http";
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
}

interface MCPToolInfo {
  server: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface MCPConnection {
  process: ChildProcess;
  nextId: number;
  pending: Map<number, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>;
  buffer: string;
  initialized: boolean;
}

export class MCPManager {
  private servers: Map<string, MCPServerConfig> = new Map();
  private connections: Map<string, MCPConnection> = new Map();
  private tools: Map<string, MCPToolInfo> = new Map();

  addServer(config: MCPServerConfig): void {
    this.servers.set(config.name, config);
  }

  removeServer(name: string): void {
    this.servers.delete(name);
    // If connected, disconnect first
    const conn = this.connections.get(name);
    if (conn) {
      conn.process.kill();
      this.connections.delete(name);
    }
    // Remove tools belonging to this server
    for (const [toolKey, info] of this.tools) {
      if (info.server === name) {
        this.tools.delete(toolKey);
      }
    }
  }

  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  listTools(): MCPToolInfo[] {
    return Array.from(this.tools.values());
  }

  async connect(name: string): Promise<boolean> {
    const config = this.servers.get(name);
    if (!config) {
      throw new Error(`MCP server '${name}' not configured`);
    }
    if (this.connections.has(name)) {
      return true; // Already connected
    }
    if (config.transport === "stdio") {
      return this.connectStdio(name, config);
    }
    // HTTP transport not implemented yet
    throw new Error(`HTTP transport not yet supported for MCP server '${name}'`);
  }

  private connectStdio(name: string, config: MCPServerConfig): Promise<boolean> {
    if (!config.command) {
      throw new Error(`stdio transport requires 'command' for server '${name}'`);
    }
    const child = spawn(config.command, config.args ?? [], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...(config.env ?? {}) },
    });

    const conn: MCPConnection = {
      process: child,
      nextId: 1,
      pending: new Map(),
      buffer: "",
      initialized: false,
    };

    this.connections.set(name, conn);

    child.stdout?.on("data", (data: Buffer) => {
      conn.buffer += data.toString();
      this.processMessages(name, conn);
    });

    child.stderr?.on("data", (data: Buffer) => {
      // Log stderr but don't fail
      console.error(`[MCP ${name}] ${data.toString().trim()}`);
    });

    child.on("error", (err: Error) => {
      console.error(`[MCP ${name}] process error: ${err.message}`);
      for (const [, { reject }] of conn.pending) {
        reject(new Error(`MCP server '${name}' process error: ${err.message}`));
      }
      conn.pending.clear();
      this.connections.delete(name);
    });

    child.on("exit", (code: number | null) => {
      console.error(`[MCP ${name}] process exited with code ${code}`);
      for (const [, { reject }] of conn.pending) {
        reject(new Error(`MCP server '${name}' exited`));
      }
      conn.pending.clear();
      this.connections.delete(name);
    });

    // Send initialize request
    return this.sendRequest(name, "initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "spiral", version: "1.0.0" },
    })
      .then(async () => {
        conn.initialized = true;
        // After initialize, send initialized notification
        this.sendNotification(name, "notifications/initialized", {});
        // List tools
        await this.refreshTools(name);
        return true;
      })
      .catch((err: Error) => {
        this.connections.delete(name);
        child.kill();
        throw err;
      });
  }

  private async refreshTools(name: string): Promise<void> {
    const result = (await this.sendRequest(name, "tools/list", {})) as {
      tools?: Array<{
        name: string;
        description?: string;
        inputSchema?: Record<string, unknown>;
      }>;
    };
    const tools = result.tools ?? [];
    for (const tool of tools) {
      const toolKey = `${name}:${tool.name}`;
      this.tools.set(toolKey, {
        server: name,
        name: tool.name,
        description: tool.description ?? "",
        parameters: tool.inputSchema ?? {},
      });
    }
  }

  async disconnect(name: string): Promise<void> {
    const conn = this.connections.get(name);
    if (!conn) return;
    conn.process.kill();
    this.connections.delete(name);
    // Remove tools for this server
    for (const [toolKey, info] of this.tools) {
      if (info.server === name) {
        this.tools.delete(toolKey);
      }
    }
  }

  async disconnectAll(): Promise<void> {
    for (const name of Array.from(this.connections.keys())) {
      await this.disconnect(name);
    }
  }

  async callTool(server: string, toolName: string, args: Record<string, unknown>): Promise<string> {
    const conn = this.connections.get(server);
    if (!conn) {
      throw new Error(`MCP server '${server}' not connected`);
    }
    const result = (await this.sendRequest(server, "tools/call", {
      name: toolName,
      arguments: args,
    })) as { content?: Array<{ type: string; text?: string }> } | string;
    // Extract text from result
    if (typeof result === "string") return result;
    if (result?.content && Array.isArray(result.content)) {
      return result.content.map((c: { type: string; text?: string }) => c.text ?? "").join("\n");
    }
    return JSON.stringify(result);
  }

  private sendRequest(
    server: string,
    method: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const conn = this.connections.get(server);
    if (!conn) {
      return Promise.reject(new Error(`MCP server '${server}' not connected`));
    }
    const id = conn.nextId++;
    const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params });
    return new Promise((resolve, reject) => {
      conn.pending.set(id, { resolve, reject: reject as (reason: Error) => void });
      conn.process.stdin?.write(msg + "\n");
    });
  }

  private sendNotification(server: string, method: string, params: Record<string, unknown>): void {
    const conn = this.connections.get(server);
    if (!conn) return;
    const msg = JSON.stringify({ jsonrpc: "2.0", method, params });
    conn.process.stdin?.write(msg + "\n");
  }

  private processMessages(_server: string, conn: MCPConnection): void {
    // Split on newlines — each line is a JSON-RPC message
    while (true) {
      const idx = conn.buffer.indexOf("\n");
      if (idx === -1) break;
      const line = conn.buffer.slice(0, idx).trim();
      conn.buffer = conn.buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line) as {
          id?: number;
          method?: string;
          result?: unknown;
          error?: { message: string };
        };
        if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
          const pending = conn.pending.get(msg.id);
          if (pending) {
            conn.pending.delete(msg.id);
            if (msg.error) {
              pending.reject(new Error(msg.error.message));
            } else {
              pending.resolve(msg.result);
            }
          }
        }
      } catch {
        // Not valid JSON, skip
      }
    }
  }
}
