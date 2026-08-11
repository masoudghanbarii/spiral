import React, { useState } from "react";
import { Box, Text, useInput, useApp } from "ink";

interface OnboardingProps {
  onLaunch: (prompt: string) => void;
  model?: string;
  mode?: string;
  modeColor?: string;
  agent?: string;
  plugins?: string[];
}

export function Onboarding({
  onLaunch,
  model = "Kimi-k2.6",
  mode = "normal",
  modeColor = "green",
  agent = "agent",
  plugins = [],
}: OnboardingProps): React.ReactElement {
  const [prompt, setPrompt] = useState("");
  const { exit } = useApp();

  useInput((inputChar: string, key: any) => {
    if (key.return && !key.shift) {
      const text = prompt || 'ship or die, "build an app to store food calories"';
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
      <Box flexDirection="column" width="80%">
        {/* Logo */}
        <Box marginBottom={2}>
          <Text bold color="blue">
            SPIRAL
          </Text>
          <Text color="gray"> v1.0</Text>
        </Box>

        {/* Greeting */}
        <Box justifyContent="center" marginBottom={2}>
          <Text color="white">Howdy! What's on your mind?</Text>
        </Box>

        {/* Textarea with blue border */}
        <Box borderStyle="round" borderColor="blue" padding={1}>
          <Text color={prompt ? "white" : "gray"}>
            {prompt || 'ship or die, "build an app to store food calories"'}
          </Text>
        </Box>

        {/* Model/Mode/agent info */}
        <Box justifyContent="space-between" marginTop={1}>
          <Box>
            <Text color="gray">Model:<Text color="white"> {model}</Text> Mode:</Text>
            <Text color={modeColor as any}> {mode}</Text>
            <Text color="gray"> (shift+tab to switch)</Text>
          </Box>
          <Box>
            <Text color="gray">agent:<Text color="green"> {agent}</Text> (tab to switch)</Text>
          </Box>
        </Box>

        {/* Plugins */}
        {plugins.length > 0 && (
          <Box marginTop={1}>
            <Text color="gray">Activated plugins: <Text color="white">{plugins.join(", ")}</Text></Text>
          </Box>
        )}

        {/* Hint */}
        <Box justifyContent="center" marginTop={2}>
          <Text color="gray">press <Text color="white">enter</Text> to launch a session</Text>
        </Box>
      </Box>
    </Box>
  );
}

export default Onboarding;