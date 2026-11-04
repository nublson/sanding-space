"use client";

import {
  ExternalLink,
  FileText,
  Image,
  Link,
  LoaderCircle,
  RotateCw,
  Share,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { agentPrompt, openInLinks } from "@/lib/share";
import { CopyButton } from "./copy-button";
import { useStoryImage } from "./use-story-image";

const button = "text-subtle-foreground pointer-coarse:size-11";

/**
 * The essay header's share row: copy the essay as Markdown (which leads with
 * its Apply brief), copy its link, or share it: open it in an AI assistant,
 * as a story image, or through the share sheet.
 */
export function EssayShare({
  slug,
  title,
  url,
  hasApply,
}: {
  slug: string;
  title: string;
  url: string;
  hasApply: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Known only after mount, so the server and first client render agree.
  const [canShareLink, setCanShareLink] = useState(false);
  const markdown = useRef<Promise<string> | null>(null);
  const story = useStoryImage(slug);

  useEffect(() => {
    setCanShareLink(typeof navigator.share === "function");
  }, []);

  function loadMarkdown(): Promise<string> {
    markdown.current ??= fetch(`/api/markdown/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Markdown: ${r.status}`);
        return r.text();
      })
      .catch((error) => {
        markdown.current = null; // the next press fetches again
        throw error;
      });
    return markdown.current;
  }

  function prefetchMarkdown() {
    loadMarkdown().catch(() => {});
  }

  async function shareStory() {
    if ((await story.share()) === "done") setOpen(false);
  }

  async function shareLink() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Dismissed, or refused: nothing to undo.
    }
  }

  return (
    // The last icon, not its hit area, lines up with the column's edge.
    <div className="-mr-2 pointer-coarse:-mr-3.5 flex items-center">
      <CopyButton
        label="Copy as Markdown"
        failedLabel="Couldn't copy the Markdown. Try again"
        icon={FileText}
        source={loadMarkdown}
        onPrefetch={prefetchMarkdown}
        className={button}
      />
      <CopyButton
        label="Copy link"
        failedLabel="Couldn't copy the link. Try again"
        icon={Link}
        source={() => url}
        className={button}
      />
      <Menu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) story.prefetch();
        }}
      >
        <MenuTrigger
          render={
            <Button data-sound="tap" aria-label="Share" className={button} />
          }
        >
          <Share aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup>
          {openInLinks(agentPrompt(url, hasApply)).map((link) => (
            <MenuLinkItem
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              data-sound="tap"
            >
              <ExternalLink aria-hidden="true" />
              Open in {link.name}
            </MenuLinkItem>
          ))}
          <MenuSeparator />
          <MenuItem
            closeOnClick={false}
            data-sound="tap"
            aria-busy={story.state === "loading"}
            onClick={shareStory}
          >
            {story.state === "loading" ? (
              <LoaderCircle
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
            ) : story.state === "error" ? (
              <RotateCw aria-hidden="true" />
            ) : (
              <Image aria-hidden="true" />
            )}
            {story.label}
          </MenuItem>
          {canShareLink && (
            <MenuItem data-sound="tap" onClick={shareLink}>
              <Share2 aria-hidden="true" />
              Share link…
            </MenuItem>
          )}
        </MenuPopup>
      </Menu>
      <output aria-live="polite" className="sr-only">
        {story.state === "error" ? "Couldn't make the story image." : ""}
      </output>
    </div>
  );
}
