from __future__ import annotations

import json
import os
import subprocess
from typing import Any


class MCPClient:
    def __init__(self, server_config: dict[str, Any]):
        self.name = server_config.get("name", "unknown")
        self.transport = server_config.get("transport", "stdio")
        self.command = server_config.get("command")
        self.args: list[str] = server_config.get("args", [])
        self.env: dict[str, str] = server_config.get("env", {})
        self.url = server_config.get("url")
        self._process: subprocess.Popen | None = None
        self._tools: list[dict[str, Any]] = []

    def connect(self) -> bool:
        if self.transport == "stdio" and self.command:
            full_env = {**os.environ, **self.env}
            self._process = subprocess.Popen(
                [self.command, *self.args],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=full_env,
            )
            return self._handshake()
        return False

    def _handshake(self) -> bool:
        init_msg = {
            "jsonrpc": "2.0",
            "id": 0,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "spiral", "version": "0.1.0"},
            },
        }
        response = self._send(init_msg)
        if response and response.get("result"):
            list_msg = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/list",
                "params": {},
            }
            tools_response = self._send(list_msg)
            if tools_response and tools_response.get("result"):
                self._tools = tools_response["result"].get("tools", [])
                return True
        return False

    def _send(self, msg: dict[str, Any]) -> dict[str, Any] | None:
        if not self._process or not self._process.stdin:
            return None
        try:
            self._process.stdin.write(json.dumps(msg) + "\n")
            self._process.stdin.flush()
            line = self._process.stdout.readline()
            if line:
                return json.loads(line)
        except (OSError, json.JSONDecodeError):
            return None
        return None

    def list_tools(self) -> list[dict[str, Any]]:
        return self._tools

    def call_tool(self, name: str, args: dict[str, Any]) -> str:
        msg = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": name, "arguments": args},
        }
        response = self._send(msg)
        if response and response.get("result"):
            content = response["result"].get("content", [])
            texts = [
                block.get("text", "")
                for block in content
                if block.get("type") == "text"
            ]
            return "\n".join(texts)
        return f"Error: tool call failed for {name}"

    def disconnect(self) -> None:
        if self._process:
            self._process.terminate()
            self._process = None


class MCPManager:
    def __init__(self, config: Any):
        self.config = config
        self.clients: list[MCPClient] = []
        servers_json = os.getenv("SPIRAL_MCP_SERVERS", "[]")
        try:
            servers = json.loads(servers_json)
        except json.JSONDecodeError:
            servers = []
        for s in servers:
            client = MCPClient(s)
            self.clients.append(client)

    def connect_all(self) -> list[str]:
        connected: list[str] = []
        for c in self.clients:
            if c.connect():
                connected.append(c.name)
        return connected

    def get_all_tools(self) -> list[dict[str, Any]]:
        tools: list[dict[str, Any]] = []
        for c in self.clients:
            for t in c.list_tools():
                tools.append(
                    {
                        "type": "function",
                        "function": {
                            "name": f"mcp_{c.name}_{t['name']}",
                            "description": t.get("description", ""),
                            "parameters": t.get(
                                "inputSchema", {"type": "object", "properties": {}}
                            ),
                        },
                    }
                )
        return tools

    def call_tool(self, full_name: str, args: dict[str, Any]) -> str:
        for c in self.clients:
            prefix = f"mcp_{c.name}_"
            if full_name.startswith(prefix):
                tool_name = full_name[len(prefix) :]
                return c.call_tool(tool_name, args)
        return f"Error: MCP tool '{full_name}' not found"

    def disconnect_all(self) -> None:
        for c in self.clients:
            c.disconnect()
