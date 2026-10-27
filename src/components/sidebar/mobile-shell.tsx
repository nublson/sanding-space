"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { ShavingMark } from "@/components/brand/shaving-mark";
import {
  clampOffset,
  ownsHorizontalGesture,
  releaseVelocity,
  rubberBand,
  type Sample,
  SWIPE_SLOP,
  settlesOpen,
  settleTransition,
  translateX,
} from "@/components/sidebar/swipe";
import { INTRODUCTION } from "@/lib/introduction";
import { playSound } from "@/lib/sounds";

const SIDEBAR_ID = "site-sidebar";

/**
 * Below `md`: a fixed header (toggle, then the wordmark) and an off-canvas sidebar
 * that pushes the content right, opened by the toggle or a horizontal swipe. At
 * `md`+: the sidebar sticks beside content.
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
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  // False when a swipe opened the sidebar: see the focus effect below.
  const focusOnOpenRef = useRef(true);
  const pathname = usePathname();
  const router = useRouter();
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

  // Move focus into the sidebar once it opens, for the toggle's keyboard and
  // assistive-tech users. Not after a swipe, a touch-only gesture: nothing
  // had focus, so the browser would treat the scripted focus as keyboard
  // focus and ring the first link under the finger.
  useEffect(() => {
    if (open && !focusOnOpenRef.current) {
      focusOnOpenRef.current = true;
      return;
    }
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

  // Links prefetch as they enter the viewport, but the closed sidebar sits
  // off-screen and opening it doesn't count, so on a phone nothing in it was
  // prefetched: a tap waited on the server with no response on screen. Opening
  // is the intent; warm every route in it so a tap lands on its shell at once.
  useEffect(() => {
    if (!open) return;
    const links =
      sidebarRef.current?.querySelectorAll<HTMLAnchorElement>('a[href^="/"]');
    const hrefs = new Set(
      Array.from(links ?? [], (link) => link.getAttribute("href") ?? ""),
    );
    for (const href of hrefs) if (href !== pathname) router.prefetch(href);
  }, [open, pathname, router]);

  useEffect(() => {
    const el = sidebarRef.current;
    function onClick(event: MouseEvent) {
      closeIfCurrent((event.target as Element).closest("a[href]"));
    }
    el?.addEventListener("click", onClick);
    return () => el?.removeEventListener("click", onClick);
  }, [closeIfCurrent]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Swipe, touch only and below md: once a drag commits to the horizontal
  // axis the track follows the finger from wherever it is (mid-slide too),
  // stretching past either end, and the release settles open or shut at the
  // finger's speed; a slow one uses the toggle's push spring. Vertical scroll
  // and pinch-zoom stay with the browser (touch-action on the root).
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const sidebar = sidebarRef.current;
    if (!root || !track || !sidebar) return;
    const mobile = window.matchMedia?.("(max-width: 767.98px)");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let drag: {
      id: number;
      x0: number;
      y0: number;
      t0: number;
      /** The offset the drag adds dx to; set when it commits to the x axis. */
      from: number;
      width: number;
      moving: boolean;
      samples: Sample[];
    } | null = null;
    // A drag that ends over a link or the scrim must not also press it: the
    // click a touch fires on lifting is dropped, but only within this window,
    // so a later keyboard or assistive-tech activation still goes through.
    let swallowClickUntil = 0;
    // Clears the release's inline transition once it has played. Removing
    // it mid-slide would cancel the slide and snap to the end, so this waits
    // for transitionend, with a fallback that defers while one still runs.
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    function settled() {
      clearTimeout(settleTimer);
      const sliding = track
        ?.getAnimations?.()
        .some((a) => a.playState === "running");
      if (sliding) {
        settleTimer = setTimeout(settled, 200);
        return;
      }
      track?.style.removeProperty("transition");
      track?.style.removeProperty("will-change");
    }
    function onTransitionEnd(event: TransitionEvent) {
      if (event.target === track && event.propertyName === "translate")
        settled();
    }
    function release(transition: string | null) {
      track?.style.removeProperty("translate");
      sidebar?.style.removeProperty("visibility");
      sidebar?.style.removeProperty("transition");
      clearTimeout(settleTimer);
      if (transition) track?.style.setProperty("transition", transition);
      else track?.style.removeProperty("transition");
      // In case no transition runs (already at rest, reduced motion).
      settleTimer = setTimeout(settled, 600);
    }
    function onPointerDown(event: PointerEvent) {
      swallowClickUntil = 0;
      if (event.pointerType !== "touch" || !event.isPrimary) return;
      if (
        !mobile?.matches ||
        ownsHorizontalGesture(event.target, root as Element)
      )
        return;
      drag = {
        id: event.pointerId,
        x0: event.clientX,
        y0: event.clientY,
        t0: event.timeStamp,
        from: 0,
        width: sidebar?.offsetWidth ?? 0,
        moving: false,
        samples: [],
      };
    }
    function onPointerMove(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x0;
      if (!drag.moving) {
        const dy = event.clientY - drag.y0;
        if (Math.hypot(dx, dy) < SWIPE_SLOP) return;
        // Where the track is now, mid-slide included, so grabbing it never
        // jumps; the class's resting offset when it can't be read.
        const at =
          (track && translateX(getComputedStyle(track).translate)) ??
          (openRef.current ? 0 : -drag.width);
        // Vertical, or outwards from an end it already rests at: not a swipe.
        if (
          Math.abs(dy) > Math.abs(dx) ||
          (dx > 0 && at >= -0.5) ||
          (dx < 0 && at <= -drag.width + 0.5)
        ) {
          drag = null;
          return;
        }
        drag.moving = true;
        drag.from = at - dx;
        clearTimeout(settleTimer);
        track?.style.setProperty("transition", "none");
        track?.style.setProperty("will-change", "translate");
        // Shown at once: the closed sidebar's visibility change is delayed.
        sidebar?.style.setProperty("transition", "none");
        sidebar?.style.setProperty("visibility", "visible");
      }
      track?.style.setProperty(
        "translate",
        `${rubberBand(drag.from + dx, drag.width)}px 0`,
      );
      drag.samples.push({ x: event.clientX, t: event.timeStamp });
      if (drag.samples.length > 8) drag.samples.shift();
    }
    function onPointerUp(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const ended = drag;
      drag = null;
      if (!ended.moving) return;
      swallowClickUntil = performance.now() + 300;
      const dx = event.clientX - ended.x0;
      const drawn = rubberBand(ended.from + dx, ended.width);
      // Lifting counts too: a finger held still before letting go has no speed.
      const velocity = releaseVelocity([
        ...ended.samples,
        { x: event.clientX, t: event.timeStamp },
      ]);
      const next = settlesOpen({
        offset: clampOffset(ended.from + dx, ended.width),
        velocity,
        travel: dx,
        elapsed: event.timeStamp - ended.t0,
        width: ended.width,
      });
      // Clearing the inline offset and changing the class land in the same
      // frame, so the transition runs from the finger's position, carrying
      // its speed. Reduced motion keeps the stylesheet's instant settle.
      release(
        reduced?.matches
          ? null
          : settleTransition((next ? 0 : -ended.width) - drawn, velocity),
      );
      if (next !== openRef.current) {
        playSound(next ? "toggle-on" : "toggle-off");
        focusOnOpenRef.current = !next;
        setInstant(false);
        setOpen(next);
      }
    }
    function onPointerCancel(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const ended = drag;
      drag = null;
      if (ended.moving) release(null);
    }
    function onClick(event: MouseEvent) {
      if (performance.now() > swallowClickUntil) return;
      swallowClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
    }

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerCancel);
    root.addEventListener("click", onClick, true);
    track.addEventListener("transitionend", onTransitionEnd);
    return () => {
      track.removeEventListener("transitionend", onTransitionEnd);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerCancel);
      root.removeEventListener("click", onClick, true);
      clearTimeout(settleTimer);
    };
  }, []);

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
    <div
      ref={rootRef}
      className="overflow-x-clip max-md:touch-pan-y max-md:touch-pinch-zoom"
    >
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
        ref={trackRef}
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
