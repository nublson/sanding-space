import {
  type BundledLanguage,
  createCssVariablesTheme,
  createHighlighter,
  type Highlighter,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

/**
 * Server-side syntax highlighting for Notion code blocks. The theme colors
 * nothing itself: every token carries a `--shiki-*` variable, and
 * `globals.css` maps those to the site's grays, so code stays monochrome.
 */

const THEME = createCssVariablesTheme({
  name: "css-variables",
  variablePrefix: "--shiki-",
});

// Notion's language name → the grammar we load. Notion has no TSX or JSX,
// and essays write JSX in TypeScript and JavaScript blocks.
const LANGUAGES: Record<string, BundledLanguage> = {
  typescript: "tsx",
  javascript: "jsx",
  css: "css",
  html: "html",
  json: "json",
  shell: "bash",
  bash: "bash",
  markdown: "markdown",
};

/** The grammar for a Notion language, or null to render it as plain text. */
export function shikiLanguage(notionLanguage: string): BundledLanguage | null {
  return LANGUAGES[notionLanguage] ?? null;
}

export type CodeToken = {
  content: string;
  /** A `var(--shiki-…)` color, or null for plain text. */
  color: string | null;
  italic: boolean;
};

let highlighter: Promise<Highlighter> | null = null;
function getHighlighter() {
  highlighter ??= createHighlighter({
    // No WebAssembly: the same engine in tests, Node and on Vercel.
    engine: createJavaScriptRegexEngine(),
    themes: [THEME],
    langs: [...new Set(Object.values(LANGUAGES))],
  });
  return highlighter;
}

// Shiki's FontStyle bit for italic.
const ITALIC = 1;

/** The code as lines of tokens, one array per line (empty lines included). */
export async function highlightCode(
  code: string,
  notionLanguage: string,
): Promise<CodeToken[][]> {
  // Cached: the tokens depend only on the arguments, and Shiki reads the
  // clock (its time limit), which a prerender may not do uncached.
  "use cache";
  const lang = shikiLanguage(notionLanguage);
  if (!lang)
    return code
      .split("\n")
      .map((line) =>
        line ? [{ content: line, color: null, italic: false }] : [],
      );
  const { tokens } = (await getHighlighter()).codeToTokens(code, {
    lang,
    theme: THEME.name as string,
  });
  return tokens.map((line) =>
    line.map((token) => ({
      content: token.content,
      color: token.color ?? null,
      italic: ((token.fontStyle ?? 0) & ITALIC) !== 0,
    })),
  );
}
