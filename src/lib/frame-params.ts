export type FrameParams = {
  theme: "light" | "dark" | "system";
  bg: "default" | "transparent";
  chrome: boolean;
};

const FRAME_KEYS = new Set(["theme", "bg", "chrome"]);

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
    if (FRAME_KEYS.has(key)) continue;
    const v = first(value);
    if (v !== undefined) params[key] = v;
  }
  return {
    frame: {
      theme: theme === "light" || theme === "dark" ? theme : "system",
      bg: bg === "transparent" ? "transparent" : "default",
      chrome: first(search.chrome) !== "0",
    },
    params,
  };
}
