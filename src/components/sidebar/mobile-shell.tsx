"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ShavingMark } from "@/components/brand/shaving-mark";

const SIDEBAR_ID = "site-sidebar";

/**
 * Below `md`: a fixed header (toggle + wordmark) and an off-canvas sidebar
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
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Move focus into the sidebar once it opens.
  useEffect(() => {
    if (open) {
      sidebarRef.current
        ?.querySelector<HTMLElement>("a[href], button")
        ?.focus({ preventScroll: true });
    }
  }, [open]);

  // Choosing a link closes the sidebar (and navigates).
  useEffect(() => {
    const el = sidebarRef.current;
    function onClick(event: MouseEvent) {
      if ((event.target as Element).closest("a[href]")) close(false);
    }
    el?.addEventListener("click", onClick);
    return () => el?.removeEventListener("click", onClick);
  }, [close]);

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
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-1 border-b border-border bg-background px-2 md:hidden">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={SIDEBAR_ID}
          aria-label="Toggle sidebar"
          data-sound={open ? "toggle-off" : "toggle-on"}
          onClick={() => setOpen((value) => !value)}
          className="press flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <PanelLeft aria-hidden className="size-5" />
        </button>
        <Link
          href="/"
          className="flex h-11 items-center gap-2 text-sm font-medium text-foreground"
        >
          <ShavingMark size={18} />
          Sanding Space
        </Link>
      </header>

      <div
        data-open={open}
        className="shell-track flex max-md:w-[calc(100%+11rem)] max-md:-translate-x-44 max-md:data-[open=true]:translate-x-0 md:mx-auto md:max-w-[1024px] md:gap-8 md:px-8"
      >
        <div
          ref={sidebarRef}
          id={SIDEBAR_ID}
          data-open={open}
          className="shell-sidebar sticky top-0 h-dvh w-44 shrink-0 self-start overflow-y-auto max-md:pt-6 max-md:pl-4 md:w-40"
        >
          {sidebar}
        </div>
        <div className="relative min-w-0 flex-1">
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
      </div>
    </div>
  );
}
