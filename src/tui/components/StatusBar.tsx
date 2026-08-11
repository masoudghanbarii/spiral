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
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      paddingY={1}
      flexShrink={0}
      flexDirection="column"
    >
      {/* Status line */}
      <Box>
        <Text color={statusColor as any}>{statusIcon}</Text>
        <Text color="gray"> {statusLabel} · {elapsed} | connected</Text>
      </Box>

      {/* Mode/agent/session line */}
      <Box>
        <Text color="gray">mode: {modeLabel} | agent: {agentLabel} | session: {sessionName}</Text>
      </Box>

      {/* Provider + tokens line */}
      <Box>
        <Text color="gray">{provider} | tokens {tokensLabel}</Text>
      </Box>

      {/* Plugins line */}
      {pluginsLabel && (
        <Box>
          <Text color="gray">Activated plugins: <Text color="white">{pluginsLabel}</Text></Text>
        </Box>
      )}

      {/* Roles line */}
      <Box>
        <Text color="gray">roles (</Text>
        <Text color="blue">/agentplan</Text>
        <Text color="gray">): {roleModelsLabel}</Text>
      </Box>
    </Box>
  );
}

export default StatusBar;