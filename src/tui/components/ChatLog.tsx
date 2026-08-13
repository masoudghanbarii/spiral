import React, { useEffect, useState } from "react";
import { Box, Text, useStdout } from "ink";
import type { LogEntry } from "./types.js";

interface ChatLogProps {
  entries: LogEntry[];
  scrollOffset?: number;
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
  scrollOffset = 0,
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
  const { stdout } = useStdout();
  const termHeight = stdout?.rows ?? 24;
  const reservedRows = 3 + 5 + 7 + 3; // topBar + sessionHeader(max) + inputBar(min+smallBuffer) + statusBar
  const availableHeight = Math.max(termHeight - reservedRows, 6);
  const [internalOffset, setInternalOffset] = useState(0);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    setInternalOffset(0);
  }, [entries.length]);

  // Sync external scroll offset
  useEffect(() => {
    setInternalOffset(scrollOffset);
  }, [scrollOffset]);

  // Calculate visible window — show recent entries, let overflow hide the rest
  const maxVisibleEntries = Math.min(entries.length, availableHeight);
  const startIdx = Math.max(0, entries.length - maxVisibleEntries - internalOffset);
  const visibleEntries = entries.slice(startIdx);

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1} overflow="hidden">
      {/* Scroll indicator */}
      {internalOffset > 0 && (
        <Text color="gray">↑ {internalOffset} entries hidden (Ctrl+Up/Down to scroll)</Text>
      )}

      {visibleEntries.map((entry, i) => (
        <EntryView key={startIdx + i} entry={entry} />
      ))}

      {/* Permission approval box */}
      {isWaitingApproval && (
        <Box
          marginTop={1}
          borderStyle="single"
          borderColor="magenta"
          paddingX={1}
          flexDirection="column"
        >
          <Box marginBottom={1}>
            <Text color="magenta">
              {"‼ permission required — "}
              {pendingTool}
            </Text>
          </Box>
          <Box gap={1}>
            <Box borderStyle="single" borderColor="green" paddingX={1}>
              <Text color="green">approve</Text>
            </Box>
            <Box borderStyle="single" borderColor="red" paddingX={1}>
              <Text color="red">deny</Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Error */}
      {isError && (
        <Box marginTop={1}>
          <Text color="red">
            {"✕ "}
            {lastError}
          </Text>
        </Box>
      )}

      {/* Compacting */}
      {isCompacting && (
        <Box marginTop={1}>
          <Text color="blue">{"↻ compacting context — summarizing older trace entries…"}</Text>
        </Box>
      )}

      {/* Running banner */}
      {isRunning && (
        <Box marginTop={1}>
          <Text color="yellow">
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
      <Box flexDirection="column">
        <Box>
          <Text bold color="cyan">{"> "}</Text>
          <Text>{entry.text ?? ""}</Text>
        </Box>
      </Box>
    );
  }
  if (entry.kind === "assistant") {
    return (
      <Box flexDirection="column">
        <Box>
          <Text bold color="green">{"✦ "}</Text>
          <Text>{entry.text ?? ""}</Text>
        </Box>
      </Box>
    );
  }
  if (entry.kind === "tool") {
    return (
      <Box marginLeft={2} flexDirection="column">
        <Box>
          <Text color="yellow">{"⚡ "}{entry.tool}</Text>
          <Text color="gray"> {entry.detail}</Text>
        </Box>
      </Box>
    );
  }
  // system
  return (
    <Box flexDirection="column">
      <Text>{entry.text ?? ""}</Text>
    </Box>
  );
}

export default ChatLog;
