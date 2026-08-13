import React from "react";
import { Box, Text } from "ink";
import type { SessionView } from "./types.js";

interface SidebarProps {
  sessions: SessionView[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  width?: number;
}

export function Sidebar({
  sessions,
  searchQuery,
  onSearchChange,
  width = 28,
}: SidebarProps): React.ReactElement {
  void onSearchChange;

  return (
    <Box
      flexDirection="column"
      width={width}
      flexShrink={0}
      borderStyle="round"
      borderColor="gray"
      marginRight={0}
    >
      {/* Header + Search */}
      <Box paddingX={1} paddingTop={1} paddingBottom={1} flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="white">Sessions</Text>
        </Box>
        <Box borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color={searchQuery ? "white" : "gray"}>{searchQuery || "search…"}</Text>
        </Box>
      </Box>

      {/* Session list */}
      <Box flexDirection="column" paddingX={1} paddingBottom={1} flexGrow={1} overflow="hidden">
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} />
        ))}
      </Box>
    </Box>
  );
}

function SessionRow({ session }: { session: SessionView }): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      paddingLeft={1}
      paddingRight={1}
      paddingTop={0}
      paddingBottom={0}
      marginBottom={0}
      marginTop={0}
      borderStyle={session.groupDot ? "single" : undefined}
      borderRight={false}
      borderTop={false}
      borderBottom={false}
      borderColor={session.borderColor as any}
    >
      {/* Name + agent label */}
      <Box justifyContent="space-between">
        <Text color={session.nameColor as any} bold={session.isActive}>{session.name}</Text>
        <Text color={session.modeColor as any}>{session.agentLabel}</Text>
      </Box>

      {/* Status + group dot + link */}
      <Box alignItems="center" gap={1}>
        <Text color={session.statusColor as any}>{session.statusIcon}</Text>
        <Text color="gray">{session.statusLabel}</Text>
        {session.groupDot && <Text color={session.groupDot as any} bold>●</Text>}
        {session.canLink && <Text color={session.linkColor as any}>⇄</Text>}
      </Box>
    </Box>
  );
}

export default Sidebar;