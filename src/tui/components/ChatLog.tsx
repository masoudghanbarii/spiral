import React from "react";
import { Box, Text } from "ink";
import type { LogEntry } from "./types.js";

interface ChatLogProps {
  entries: LogEntry[];
  isWaitingApproval: boolean;
  pendingTool: string;
  onApprove: () => void;
  onDeny: () => void;
  isError: boolean;
  lastError: string;
  isCompacting: boolean;
  isRunning: boolean;
  statusIcon: string;
  loadingWord: string;
  elapsed: string;
}

export function ChatLog({
  entries,
  isWaitingApproval,
  pendingTool,
  onApprove: _onApprove,
  onDeny: _onDeny,
  isError,
  lastError,
  isCompacting,
  isRunning,
  statusIcon,
  loadingWord,
  elapsed,
}: ChatLogProps): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={18} paddingY={14} flexGrow={1} overflow="hidden">
      {entries.map((entry, i) => (
        <EntryView key={i} entry={entry} />
      ))}

      {/* Permission approval box */}
      {isWaitingApproval && (
        <Box
          marginTop={6}
          borderStyle="single"
          borderColor="#c678dd"
          paddingX={12}
          paddingY={10}
          flexDirection="column"
        >
          <Box marginBottom={8}>
            <Text color="#c678dd">{"‼ permission required — "}{pendingTool}</Text>
          </Box>
          <Box gap={8}>
            <Box borderStyle="single" borderColor="#3ecf6a" paddingX={10} paddingY={3}>
              <Text color="#3ecf6a">approve</Text>
            </Box>
            <Box borderStyle="single" borderColor="#ef5350" paddingX={10} paddingY={3}>
              <Text color="#ef5350">deny</Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Error */}
      {isError && (
        <Box marginTop={6}>
          <Text color="#ef5350">{"✕ "}{lastError}</Text>
        </Box>
      )}

      {/* Compacting */}
      {isCompacting && (
        <Box marginTop={6}>
          <Text color="#4f8cff">{"↻ compacting context — summarizing older trace entries…"}</Text>
        </Box>
      )}

      {/* Running banner */}
      {isRunning && (
        <Box marginTop={6}>
          <Text color="#f2c94c">
            {statusIcon} {loadingWord}… · {elapsed} | connected
          </Text>
        </Box>
      )}
    </Box>
  );
}

function EntryView({ entry }: { entry: LogEntry }): React.ReactElement {
  if (entry.kind === "user") {
    return (
      <Box marginBottom={10}>
        <Text bold color="#56c8d8">{"> "}</Text>
        <Text>{entry.text}</Text>
      </Box>
    );
  }
  if (entry.kind === "assistant") {
    return (
      <Box marginBottom={10}>
        <Text bold color="#3ecf6a">{"✦ "}</Text>
        <Text>{entry.text}</Text>
      </Box>
    );
  }
  if (entry.kind === "tool") {
    return (
      <Box marginLeft={14} marginBottom={10}>
        <Text color="#f2c94c">{"⚡ "}{entry.tool}</Text>
        <Text color="#6b7383"> {entry.detail}</Text>
      </Box>
    );
  }
  // system
  return (
    <Box marginBottom={10}>
      <Text color="#6b7383">{entry.text}</Text>
    </Box>
  );
}

export default ChatLog;