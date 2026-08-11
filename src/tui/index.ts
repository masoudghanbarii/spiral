import { render } from "ink";
import React from "react";
import { Config } from "../config.js";
import { TuiApp } from "./app.js";

export async function startTui(
  config: Config,
  opts: {
    sessionId?: string;
    initialMessage?: string;
    initialView?: "onboarding" | "main";
  } = {},
): Promise<void> {
  const instance = render(
    React.createElement(TuiApp, {
      config,
      sessionId: opts.sessionId,
      initialMessage: opts.initialMessage,
      initialView: opts.initialView ?? "onboarding",
    }),
    { exitOnCtrlC: false },
  );
  await instance.waitUntilExit();
}