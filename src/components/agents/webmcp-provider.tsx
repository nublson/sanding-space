"use client";

import { useEffect } from "react";
import { type WebmcpTool, webmcpTools } from "@/lib/agents/webmcp";

type ModelContext = {
  provideContext?: (context: { tools: WebmcpTool[] }) => unknown;
  registerTool?: (tool: WebmcpTool) => unknown;
};

let registered = false;

/** Test-only: lets each test register again. */
export function resetWebmcpRegistration() {
  registered = false;
}

/**
 * The WebMCP draft still moves between shapes: prefer `provideContext`, fall
 * back to `registerTool`, and do nothing where neither exists. Registration
 * runs once per page load and can never break the page.
 */
export function registerWebmcpTools() {
  if (registered) return;
  registered = true;
  try {
    const context =
      (navigator as Navigator & { modelContext?: ModelContext }).modelContext ??
      (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context) return;
    const tools = webmcpTools(fetch.bind(globalThis));
    if (typeof context.provideContext === "function") {
      context.provideContext({ tools });
    } else if (typeof context.registerTool === "function") {
      for (const tool of tools) context.registerTool(tool);
    }
  } catch {
    // An experimental API; regular visitors must never notice it.
  }
}

export function WebmcpProvider() {
  useEffect(registerWebmcpTools, []);
  return null;
}
