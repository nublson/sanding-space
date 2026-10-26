import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { CurrentSidebar } from "@/components/sidebar/current-sidebar";
import { MobileShell } from "@/components/sidebar/mobile-shell";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SkipLink } from "@/components/skip-link";
import { MuteButton } from "@/components/sound/mute-button";
import { SoundRoot } from "@/components/sound/sound-root";
import { getLibrary } from "@/lib/content/notion";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const library = await getLibrary();
  const footer = (
    <div className="flex items-center justify-between">
      <Link
        href="/about"
        data-sound="page"
        className="link flex h-8 items-center text-base max-md:h-7 max-md:text-sm pointer-coarse:h-11"
      >
        About
      </Link>
      <MuteButton />
    </div>
  );

  return (
    <SoundRoot>
      <SkipLink />
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
