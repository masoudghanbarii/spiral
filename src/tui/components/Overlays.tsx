import React from "react";
import { Box, Text } from "ink";
import type { ModeOption, SessionOption, RoleRow } from "./types.js";

// === Mode Overlay (Shift+Tab) ===

interface ModeOverlayProps {
  open: boolean;
  options: ModeOption[];
  overlayIndex: number;
  onClose: () => void;
}

export function ModeOverlay({
  open,
  options,
  overlayIndex,
  onClose: _onClose,
}: ModeOverlayProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1} overflow="hidden">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#3a6bd8"
        paddingX={2}
        paddingY={1}
        width="100%"
        flexGrow={1}
        overflow="hidden"
      >
        <Box marginBottom={1}>
          <Text color="#7a8494">shift+tab — switch mode · ↑↓ navigate · enter select</Text>
        </Box>
        {options.map((m, i) => (
          <Box key={m.key} paddingX={1} paddingY={0} marginBottom={1}>
            <Box>
              <Text bold color={m.color as any} inverse={i === overlayIndex}>
                {i === overlayIndex ? " > " : "   "}{m.label}
              </Text>
            </Box>
            <Box>
              <Text color="#6b7383">{m.desc}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// === Session Overlay (Tab) ===

interface SessionOverlayProps {
  open: boolean;
  options: SessionOption[];
  overlayIndex: number;
  onClose: () => void;
}

export function SessionOverlay({
  open,
  options,
  overlayIndex,
  onClose: _onClose,
}: SessionOverlayProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1} overflow="hidden">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#3a6bd8"
        paddingX={2}
        paddingY={1}
        width="100%"
        flexGrow={1}
        overflow="hidden"
      >
        <Box marginBottom={1}>
          <Text color="#7a8494">tab — switch session · ↑↓ navigate · enter select</Text>
        </Box>
        {options.map((a, i) => (
          <Box key={a.key} paddingX={1} paddingY={0} marginBottom={1}>
            <Box>
              <Text bold color={a.color as any} inverse={i === overlayIndex}>
                {i === overlayIndex ? " > " : "   "}{a.label}
              </Text>
            </Box>
            <Box>
              <Text color="#6b7383">{a.desc}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// === AgentPlan Overlay (/agentplan) ===

interface AgentPlanOverlayProps {
  open: boolean;
  roleRows: RoleRow[];
  onClose: () => void;
}

export function AgentPlanOverlay({
  open,
  roleRows,
  onClose: _onClose,
}: AgentPlanOverlayProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1} overflow="hidden">
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="#3a6bd8"
        paddingX={2}
        paddingY={1}
        width="100%"
        flexGrow={1}
        overflow="hidden"
      >
        <Box marginBottom={1}>
          <Text color="#7a8494">/agentplan — model per role</Text>
        </Box>
        {roleRows.map((r) => (
          <Box key={r.role} flexDirection="column" marginBottom={0}>
            <Box>
              <Text bold color="#e6e9ef">
                {r.label}
              </Text>
            </Box>
            <Box marginBottom={1}>
              <Text color="#6b7383">{r.desc}</Text>
            </Box>
            <Box flexDirection="row" gap={1} flexWrap="wrap">
              {r.models.map((mo) => (
                <Text
                  key={mo.name}
                  color={mo.borderColor === "#4f8cff" ? "#4f8cff" : "#6b7383"}
                  bold={mo.borderColor === "#4f8cff"}
                >
                  {mo.name}
                </Text>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
