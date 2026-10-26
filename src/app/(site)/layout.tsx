import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { NavMarker } from "@/components/nav-marker";
import { CurrentSidebar } from "@/components/sidebar/current-sidebar";
import { MobileShell } from "@/components/sidebar/mobile-shell";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SkipLink } from "@/components/skip-link";
import { MuteButton } from "@/components/sound/mute-button";
import { SoundRoot } from "@/components/sound/sound-root";
import { getLibrary } from "@/lib/content/notion";
import { RESOURCES } from "@/lib/content/resources";
import { ABOUT } from "@/lib/standalone";

const footerLink =
  "link flex h-8 items-center text-base max-md:h-7 max-md:text-sm pointer-coarse:h-11";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const library = await getLibrary();
  // Resources above About; the mute button sits on About's line.
  const footer = (
    <div className="flex items-end justify-between">
      <div className="flex flex-col">
        <Link
          href={RESOURCES.path}
          transitionTypes={["sidebar-nav"]}
          data-sound="page"
          className={footerLink}
        >
          {RESOURCES.name}
        </Link>
        <Link
          href={ABOUT.path}
          transitionTypes={["sidebar-nav"]}
          data-sound="page"
          className={footerLink}
        >
          {ABOUT.name}
        </Link>
      </div>
      <MuteButton />
    </div>
  );

  return (
    <SoundRoot>
      <SkipLink />
      <NavMarker />
      <MobileShell
        sidebar={
          <Suspense
            fallback={
              <Sidebar
                sections={library.sections}
                introductionCurrent={false}
                currentSectionSlug={null}
                currentEssaySlug={null}
                footer={footer}
              />
            }
          >
            <CurrentSidebar sections={library.sections} footer={footer} />
          </Suspense>
        }
      >
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[672px] px-4 pt-[120px] pb-24 outline-none md:px-0 md:pt-32"
        >
          {children}
        </main>
      </MobileShell>
    </SoundRoot>
  );
}
