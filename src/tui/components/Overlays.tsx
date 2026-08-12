import React from "react";
import { Box, Text, useInput } from "ink";
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
  overlayIndex: _overlayIndex,
  onClose,
}: ModeOverlayProps): React.ReactElement | null {
  useInput((_inputChar: string, key: any) => {
    if (key.escape && open) {
      onClose();
    }
  });

  if (!open) return null;

  return (
    <Box position="absolute" alignItems="center" justifyContent="center" width="100%" height="100%">
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="#3a6bd8"
        paddingX={2}
        paddingY={1}
        width={50}
      >
        <Box marginBottom={1}>
          <Text color="#7a8494">shift+tab — switch mode</Text>
        </Box>
        {options.map((m) => (
          <Box key={m.key} paddingX={1} paddingY={0} marginBottom={1}>
            <Box>
              <Text bold color={m.color as any}>
                {m.label}
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
  overlayIndex: _overlayIndex,
  onClose,
}: SessionOverlayProps): React.ReactElement | null {
  useInput((_inputChar: string, key: any) => {
    if (key.escape && open) {
      onClose();
    }
  });

  if (!open) return null;

  return (
    <Box position="absolute" alignItems="center" justifyContent="center" width="100%" height="100%">
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="#3a6bd8"
        paddingX={2}
        paddingY={1}
        width={55}
      >
        <Box marginBottom={1}>
          <Text color="#7a8494">tab — switch session</Text>
        </Box>
        {options.map((a) => (
          <Box key={a.key} paddingX={1} paddingY={0} marginBottom={1}>
            <Box>
              <Text bold color={a.color as any}>
                {a.label}
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
  onClose,
}: AgentPlanOverlayProps): React.ReactElement | null {
  useInput((_inputChar: string, key: any) => {
    if (key.escape && open) {
      onClose();
    }
  });

  if (!open) return null;

  return (
    <Box position="absolute" alignItems="center" justifyContent="center" width="100%" height="100%">
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="#3a6bd8"
        paddingX={2}
        paddingY={1}
        width={60}
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
            <Box gap={1} flexWrap="wrap">
              {r.models.map((mo) => (
                <Box
                  key={mo.name}
                  borderStyle="single"
                  borderColor={mo.borderColor as any}
                  paddingX={1}
                  paddingY={0}
                >
                  <Text color="#e6e9ef">{mo.name}</Text>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
