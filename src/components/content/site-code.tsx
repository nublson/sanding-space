import { type BlockProps, languageName, plainText, RichText } from "notionic";
import { Fragment } from "react";
import { highlightCode } from "@/lib/content/highlight";
import { CopyCode } from "./copy-code";

/**
 * A Notion code block, highlighted on the server (no client JavaScript but
 * the copy button). Same frame as notionic's: the language above, the code
 * in a focusable `pre` that scrolls sideways, the caption below. Colors come
 * from `--shiki-*` variables mapped to the site's grays in `globals.css`.
 */
export async function SiteCode({ block, context }: BlockProps<"code">) {
  const { language, rich_text, caption } = block.code;
  const code = plainText(rich_text);
  const name = languageName(language);
  const lines = await highlightCode(code, language);

  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-muted">
      <div className="flex items-center justify-between gap-2 border-b border-border py-1 pr-1.5 pl-4 text-muted-foreground text-xs">
        {name}
        <CopyCode code={code} />
      </div>
      {/* A named region, so the keyboard can reach it and scroll it sideways. */}
      {/* biome-ignore lint/a11y/useSemanticElements: the code must stay a <pre> */}
      <pre
        role="region"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroller needs focus to scroll by keyboard
        tabIndex={0}
        aria-label={`Code, ${name}`}
        className="code-tokens overflow-x-auto px-4 py-3 font-mono text-[0.8125rem] leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <code>
          {lines.map((line, i) => (
            // Lines are joined by real newlines, so a selection copies them.
            // biome-ignore lint/suspicious/noArrayIndexKey: lines have no other identity
            <Fragment key={i}>
              {i > 0 && "\n"}
              <span data-line="">
                {line.map((token, j) =>
                  token.color ? (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: tokens have no other identity
                      key={j}
                      style={{
                        color: token.color,
                        fontStyle: token.italic ? "italic" : undefined,
                      }}
                    >
                      {token.content}
                    </span>
                  ) : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: tokens have no other identity
                    <Fragment key={j}>{token.content}</Fragment>
                  ),
                )}
              </span>
            </Fragment>
          ))}
        </code>
      </pre>
      {caption.length > 0 && (
        <figcaption className="border-t border-border px-4 py-2 text-muted-foreground text-sm">
          <RichText text={caption} context={context} />
        </figcaption>
      )}
    </figure>
  );
}
