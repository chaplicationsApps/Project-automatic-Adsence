"use client";

export type ToolEvent = "tool_view" | "tool_start" | "tool_submit" | "tool_complete" | "tool_error" | "result_copy" | "share_click";
export type ToolEventProperties = { tool_slug: string; category: string; version: number };

/** Integration point. No cookies, network calls or calculator inputs are collected. */
export function trackToolEvent(event: ToolEvent, properties: ToolEventProperties): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("claro:tool-event", {
    detail: { event, tool_slug: properties.tool_slug, category: properties.category, version: properties.version },
  }));
}
