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
    <Box
      borderTop
      borderColor="gray"
      flexShrink={0}
      flexDirection="column"
      paddingX={1}
    >
      {/* Line 1: status · mode · agent · tokens */}
      <Box>
        <Text color={statusColor as any}>{statusIcon}</Text>
        <Text color="gray"> {statusLabel} · {elapsed} | {modeLabel} | {agentLabel} | {provider} | {tokensLabel}</Text>
      </Box>

      {/* Line 2: session · plugins · roles */}
      <Box>
        <Text color="gray">session: {sessionName}</Text>
        {pluginsLabel && <Text color="gray"> · plugins: <Text color="white">{pluginsLabel}</Text></Text>}
        <Text color="gray"> · roles (</Text>
        <Text color="blue">/agentplan</Text>
        <Text color="gray">): {roleModelsLabel}</Text>
      </Box>
    </Box>
  );
}

export default StatusBar;