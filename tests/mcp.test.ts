import { describe, it, expect } from "vitest";
import { MCPManager } from "../src/managers/mcp.js";

describe("MCPManager", () => {
  it("addServer registers server config", () => {
    const mgr = new MCPManager();
    mgr.addServer({ name: "test", transport: "stdio", command: "echo" });
    const servers = mgr.listServers();
    expect(servers).toHaveLength(1);
    expect(servers[0]!.name).toBe("test");
  });

  it("removeServer removes server", () => {
    const mgr = new MCPManager();
    mgr.addServer({ name: "test", transport: "stdio", command: "echo" });
    mgr.removeServer("test");
    expect(mgr.listServers()).toHaveLength(0);
  });

  it("removeServer on nonexistent does not throw", () => {
    const mgr = new MCPManager();
    expect(() => mgr.removeServer("nonexistent")).not.toThrow();
  });

  it("listServers returns empty initially", () => {
    const mgr = new MCPManager();
    expect(mgr.listServers()).toEqual([]);
  });

  it("listServers returns all registered", () => {
    const mgr = new MCPManager();
    mgr.addServer({ name: "a", transport: "stdio", command: "echo" });
    mgr.addServer({ name: "b", transport: "http", url: "http://localhost" });
    expect(mgr.listServers()).toHaveLength(2);
  });

  it("addServer with http transport", () => {
    const mgr = new MCPManager();
    mgr.addServer({ name: "http-server", transport: "http", url: "http://localhost:3000" });
    expect(mgr.listServers()[0]!.name).toBe("http-server");
  });

  it("listTools returns empty initially", () => {
    const mgr = new MCPManager();
    expect(mgr.listTools()).toEqual([]);
  });

  it("callTool throws for unconnected server", async () => {
    const mgr = new MCPManager();
    await expect(mgr.callTool("unknown", "tool", {})).rejects.toThrow("not connected");
  });

  it("connect throws for unknown server", async () => {
    const mgr = new MCPManager();
    await expect(mgr.connect("unknown")).rejects.toThrow("not configured");
  });

  it("disconnect on unknown server is a no-op", async () => {
    const mgr = new MCPManager();
    await mgr.disconnect("unknown");
    expect(mgr.listServers()).toEqual([]);
  });

  it("disconnectAll with no connections is a no-op", async () => {
    const mgr = new MCPManager();
    await mgr.disconnectAll();
    expect(mgr.listServers()).toEqual([]);
  });
});
