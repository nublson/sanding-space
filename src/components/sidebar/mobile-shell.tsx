"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { ShavingMark } from "@/components/brand/shaving-mark";
import { INTRODUCTION } from "@/lib/introduction";

const SIDEBAR_ID = "site-sidebar";

/**
 * Below `md`: a fixed header (toggle, then the wordmark) and an off-canvas sidebar
 * that pushes the content right. At `md`+: the sidebar sticks beside content.
 */
export function MobileShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // True when the sidebar closed because a link navigated: the track skips
  // its CSS slide and the route's view transition moves the content instead.
  const [instant, setInstant] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [shownPath, setShownPath] = useState(pathname);

  // A navigation closes the sidebar in the render that brings the new page,
  // so both land in one commit and one view transition: before (pushed, old
  // page), after (full width, new page). Closing on click would commit ahead
  // of the route, because navigation is async.
  if (pathname !== shownPath) {
    setShownPath(pathname);
    if (open) {
      setInstant(true);
      setOpen(false);
    }
  }

  const close = useCallback((returnFocus: boolean) => {
    setInstant(false);
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // A link to the page already shown navigates nowhere: close it here.
  const closeIfCurrent = useCallback(
    (link: HTMLAnchorElement | null) => {
      if (link && new URL(link.href).pathname === pathname) close(false);
    },
    [pathname, close],
  );

  // Move focus into the sidebar once it opens.
  useEffect(() => {
    if (open) {
      // The first focusable that is actually rendered: the wordmark link is
      // hidden below md, and focus() on a display:none element does nothing.
      const focusables =
        sidebarRef.current?.querySelectorAll<HTMLElement>("a[href], button");
      Array.from(focusables ?? [])
        .find((el) => el.checkVisibility?.() ?? true)
        ?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    const el = sidebarRef.current;
    function onClick(event: MouseEvent) {
      closeIfCurrent((event.target as Element).closest("a[href]"));
    }
    el?.addEventListener("click", onClick);
    return () => el?.removeEventListener("click", onClick);
  }, [closeIfCurrent]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close(true);
    }
    // Growing to the desktop layout while open would leave content inert.
    const query = window.matchMedia?.("(min-width: 768px)");
    function onChange(event: MediaQueryListEvent) {
      if (event.matches) close(false);
    }
    document.addEventListener("keydown", onKeyDown);
    query?.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      query?.removeEventListener("change", onChange);
    };
  }, [open, close]);

  return (
    <div className="overflow-x-clip">
      <header className="site-header fixed inset-x-0 top-0 z-20 flex h-14 items-center bg-background px-2 md:hidden">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={SIDEBAR_ID}
          aria-label="Toggle sidebar"
          data-sound={open ? "toggle-off" : "toggle-on"}
          onClick={() => {
            setInstant(false);
            setOpen((value) => !value);
          }}
          className="press flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <PanelLeft aria-hidden strokeWidth={1.5} className="size-4" />
        </button>
        {/* The desktop wordmark, after the toggle (spec §9.5), on the mobile
            scale: 18px mark, 14px medium on a 28px line. */}
        <Link
          href={INTRODUCTION.path}
          transitionTypes={open ? ["sidebar-nav"] : undefined}
          onClick={(event) => closeIfCurrent(event.currentTarget)}
          className="flex h-7 items-center gap-2 ps-1 text-sm leading-7 font-medium text-foreground pointer-coarse:h-11"
        >
          <ShavingMark size={18} />
          Sanding Space
        </Link>
      </header>

      <div
        data-open={open}
        data-instant={instant}
        className="shell-track flex max-md:w-[calc(100%+13rem)] max-md:-translate-x-52 max-md:data-[open=true]:translate-x-0 md:mx-auto md:max-w-[1024px] md:gap-8 md:px-8"
      >
        <div
          ref={sidebarRef}
          id={SIDEBAR_ID}
          data-open={open}
          className="shell-sidebar sticky top-0 h-dvh w-52 shrink-0 self-start max-md:ps-4 md:w-48"
        >
          {sidebar}
        </div>
        {/* On a sidebar navigation the whole column is one transition group:
            it slides from the pushed position to full width while the old page
            crossfades into the new one. Other navigations use PageFade. The
            solid background keeps the fading sidebar from showing through. */}
        <ViewTransition
          name="site-content"
          update={{ "sidebar-nav": "shell-close", default: "none" }}
          default="none"
        >
          <div className="relative min-w-0 flex-1 max-md:bg-background">
            <div data-content inert={open}>
              {children}
            </div>
            {open && (
              <button
                type="button"
                data-testid="shell-scrim"
                aria-label="Close sidebar"
                tabIndex={-1}
                onClick={() => close(false)}
                className="absolute inset-0 z-10 cursor-default md:hidden"
              />
            )}
          </div>
        </ViewTransition>
      </div>
    </div>
  );
}
