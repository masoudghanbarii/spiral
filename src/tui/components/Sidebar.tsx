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
  width = 30,
}: SidebarProps): React.ReactElement {
  // onSearchChange is used by the parent for key handling; we display the query here
  void onSearchChange;

  return (
    <Box flexDirection="column" width={width} flexShrink={0} borderStyle="single" borderColor="gray">
      {/* Header + Search */}
      <Box paddingX={1} paddingTop={1} paddingBottom={1} flexDirection="column">
        <Box marginBottom={1}>
          <Text color="white">Sessions</Text>
        </Box>
        <Box borderStyle="single" borderColor="gray" paddingX={1}>
          <Text color={searchQuery ? "white" : "gray"}>
            {searchQuery || "search…"}
          </Text>
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
      paddingTop={1}
      paddingBottom={1}
      marginBottom={1}
      borderStyle="single"
      borderRight={false}
      borderTop={false}
      borderBottom={false}
      borderColor={session.borderColor as any}
    >
      {/* Name + agent label */}
      <Box justifyContent="space-between">
        <Text color={session.nameColor as any}>{session.name}</Text>
        <Text color={session.modeColor as any}>{session.agentLabel}</Text>
      </Box>

      {/* Status + group dot + link */}
      <Box alignItems="center" gap={1} marginTop={1}>
        <Text color={session.statusColor as any}>{session.statusIcon}</Text>
        <Text color="gray">{session.statusLabel}</Text>
        {session.groupDot && (
          <Text color={session.groupDot as any}>●</Text>
        )}
        {session.canLink && (
          <Text color={session.linkColor as any}>⇄</Text>
        )}
      </Box>
    </Box>
  );
}

export default Sidebar;