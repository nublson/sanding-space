export type FrameParams = {
  theme: "light" | "dark" | "system";
  bg: "default" | "transparent";
};

// `chrome` once toggled an attribution mark the frame no longer draws. It
// stays reserved so old ?chrome=0 embeds never pass it to a demo.
export const FRAME_PARAM_KEYS: ReadonlySet<string> = new Set([
  "theme",
  "bg",
  "chrome",
]);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function splitParams(
  search: Record<string, string | string[] | undefined>,
): {
  frame: FrameParams;
  params: Record<string, string>;
} {
  const theme = first(search.theme);
  const bg = first(search.bg);
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(search)) {
    if (FRAME_PARAM_KEYS.has(key)) continue;
    const v = first(value);
    if (v !== undefined) params[key] = v;
  }
  return {
    frame: {
      theme: theme === "light" || theme === "dark" ? theme : "system",
      bg: bg === "transparent" ? "transparent" : "default",
    },
    params,
  };
}
