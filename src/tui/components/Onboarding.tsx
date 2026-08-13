import React, { useState } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";

interface OnboardingProps {
  onLaunch: (prompt: string) => void;
  model?: string;
  mode?: string;
  modeColor?: string;
  agent?: string;
  plugins?: string[];
  termCols?: number;
}

export function Onboarding({
  onLaunch,
  model = "Kimi-k2.6",
  mode = "normal",
  modeColor = "green",
  agent = "agent",
  plugins = [],
  termCols: propCols,
}: OnboardingProps): React.ReactElement {
  const [prompt, setPrompt] = useState("");
  const { exit } = useApp();
  const { stdout } = useStdout();
  const cols = propCols ?? stdout?.columns ?? 80;
  const contentWidth = Math.max(Math.min(Math.floor(cols * 0.82), 82), 42);

  useInput((inputChar: string, key: any) => {
    if (key.return && !key.shift) {
      const text = prompt || 'ship or die...';
      onLaunch(text);
      return;
    }
    if (key.ctrl && inputChar === "c") {
      exit();
      return;
    }
    if (key.backspace || key.delete) {
      setPrompt((prev) => prev.slice(0, -1));
      return;
    }
    if (key.return && key.shift) {
      setPrompt((prev) => prev + "\n");
      return;
    }
    if (inputChar && !key.ctrl && !key.meta) {
      setPrompt((prev) => prev + inputChar);
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
      <Box flexDirection="column" width={contentWidth}>
        {/* Logo in a rounded border box */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="blue"
          paddingX={2}
          paddingY={1}
          alignItems="center"
          marginBottom={1}
        >
          <Box gap={1}>
            <Text bold color="blue">
              SPIRAL
            </Text>
            <Text color="gray">v1.0</Text>
          </Box>
          <Text color="gray" italic>
            built for agents and loops ;)
          </Text>
        </Box>

        {/* Divider */}
        <Box marginBottom={2}>
          <Text color="gray">{"─".repeat(contentWidth - 2)}</Text>
        </Box>

        {/* Greeting */}
        <Box justifyContent="center" marginBottom={2}>
          <Text color="white">Howdy! What's on your mind?</Text>
        </Box>

        {/* Textarea with blue border */}
        <Box borderStyle="round" borderColor="blue" paddingX={1} paddingY={1}>
          <Text color={prompt ? "white" : "gray"}>
            {prompt || 'ship or die...'}
          </Text>
        </Box>

        {/* Model/Mode/agent info — stacked if narrow */}
        <Box flexDirection="column" marginTop={1} gap={1}>
          <Box flexWrap="wrap" gap={1}>
            <Text color="gray">
              Model: <Text color="white">{model}</Text>
            </Text>
            <Text color="gray">·</Text>
            <Text color="gray">Mode:</Text>
            <Text color={modeColor as any}>{mode}</Text>
            <Text color="gray">(⇧+tab)</Text>
            <Text color="gray">·</Text>
            <Text color="gray">
              agent: <Text color="green">{agent}</Text>
            </Text>
            <Text color="gray">(tab)</Text>
          </Box>

          {/* Plugins */}
          {plugins.length > 0 && (
            <Box>
              <Text color="gray">
                plugins: <Text color="white">{plugins.join(", ")}</Text>
              </Text>
            </Box>
          )}
        </Box>

        {/* Hint */}
        <Box justifyContent="center" marginTop={2}>
          <Text color="gray">
            press <Text color="white" bold>enter</Text> to launch ·{" "}
            <Text color="white" bold>ctrl+c</Text> to quit
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default Onboarding;