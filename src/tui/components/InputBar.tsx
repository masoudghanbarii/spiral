import React from "react";
import { Box, Text } from "ink";
import type { SlashCommand } from "./types.js";

interface InputBarProps {
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  borderColor: string;
  model: string;
  modeLabel: string;
  modeColor: string;
  sessionShort: string;
  onOpenModeOverlay: () => void;
  onOpenSessionOverlay: () => void;
  slashCommands: SlashCommand[];
  slashMenuOpen: boolean;
  slashIndex: number;
  onSlashSelect: (index: number) => void;
}

export function InputBar({
  input,
  onInputChange: _onInputChange,
  onSubmit: _onSubmit,
  disabled,
  placeholder,
  borderColor,
  model,
  modeLabel,
  modeColor,
  sessionShort,
  onOpenModeOverlay: _onOpenModeOverlay,
  onOpenSessionOverlay: _onOpenSessionOverlay,
  slashCommands,
  slashMenuOpen,
  slashIndex,
  onSlashSelect: _onSlashSelect,
}: InputBarProps): React.ReactElement {
  const lines = input.split("\n");
  const hasInput = input.length > 0;

  return (
    <Box flexDirection="column" paddingX={1} paddingBottom={1} flexShrink={0}>
      {/* Slash command autocomplete popup */}
      {slashMenuOpen && (
        <Box
          flexDirection="column"
          marginBottom={1}
          borderStyle="single"
          borderColor="blue"
          padding={1}
        >
          {slashCommands.map((sc, i) => (
            <Box key={sc.cmd} paddingLeft={1} paddingRight={1}>
              <Text bold color="blue" inverse={i === slashIndex}>
                {sc.cmd}
              </Text>
              <Text color="gray"> {sc.desc}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Input box — render multi-line input with cursor */}
      <Box borderStyle="round" borderColor={borderColor as any} paddingX={1} flexDirection="column">
        {lines.map((line, i) => (
          <Box key={i}>
            {i === 0 && (
              <Text bold color="blue">
                {"> "}
              </Text>
            )}
            {i > 0 && <Text color="gray"> </Text>}
            {hasInput ? (
              <Text color={disabled ? "gray" : "white"}>{line}</Text>
            ) : i === 0 && !disabled ? (
              <Text color="gray" italic>
                {placeholder}
              </Text>
            ) : null}
            {i === lines.length - 1 && !disabled && <Text color="gray">{"▋"}</Text>}
          </Box>
        ))}
      </Box>

      {/* Model/Mode/session info row */}
      <Box justifyContent="space-between" marginTop={1} flexWrap="wrap">
        <Box gap={1}>
          <Text color="gray">
            Model: <Text color="white">{model}</Text>
          </Text>
          <Text color="gray">·</Text>
          <Text color="gray">Mode:</Text>
          <Text color={modeColor as any}>{modeLabel}</Text>
          <Text color="gray">(⇧+tab)</Text>
        </Box>
        <Box gap={1}>
          <Text color="gray">session:</Text>
          <Text color="blue">{sessionShort}</Text>
          <Text color="gray">(tab)</Text>
        </Box>
      </Box>
    </Box>
  );
}

export default InputBar;
