import React from "react";
import { Box, Text } from "ink";

interface StatusBarProps {
  statusIcon: string;
  statusColor: string;
  statusLabel: string;
  elapsed: string;
  modeLabel: string;
  agentLabel: string;
  sessionName: string;
  provider: string;
  tokensLabel: string;
  pluginsLabel: string | null;
  roleModelsLabel: string;
  onOpenAgentPlan: () => void;
}

export function StatusBar({
  statusIcon,
  statusColor,
  statusLabel,
  elapsed,
  modeLabel,
  agentLabel,
  sessionName,
  provider,
  tokensLabel,
  pluginsLabel,
  roleModelsLabel,
}: StatusBarProps): React.ReactElement {
  return (
    <Box borderTop borderColor="gray" flexShrink={0} flexDirection="column" paddingX={1}>
      {/* Line 1: status · elapsed · mode · agent · tokens */}
      <Box flexWrap="wrap" gap={1}>
        <Text color={statusColor as any}>{statusIcon}</Text>
        <Text color="white">{statusLabel}</Text>
        <Text color="gray">·</Text>
        <Text color="cyan">{elapsed}</Text>
        <Text color="gray">·</Text>
        <Text color="gray">mode:</Text>
        <Text color="white">{modeLabel}</Text>
        <Text color="gray">·</Text>
        <Text color="gray">agent:</Text>
        <Text color="white">{agentLabel}</Text>
        <Text color="gray">·</Text>
        <Text color="gray">{provider}</Text>
        <Text color="gray">·</Text>
        <Text color="gray">tokens:</Text>
        <Text color="white">{tokensLabel}</Text>
      </Box>

      {/* Line 2: session · plugins · roles */}
      <Box flexWrap="wrap" gap={1}>
        <Text color="gray">session:</Text>
        <Text color="white">{sessionName}</Text>
        {pluginsLabel && (
          <>
            <Text color="gray">·</Text>
            <Text color="gray">plugins:</Text>
            <Text color="white">{pluginsLabel}</Text>
          </>
        )}
        <Text color="gray">·</Text>
        <Text color="gray">roles</Text>
        <Text color="gray">(</Text>
        <Text color="blue">/agentplan</Text>
        <Text color="gray">):</Text>
        <Text color="white">{roleModelsLabel}</Text>
      </Box>
    </Box>
  );
}

export default StatusBar;