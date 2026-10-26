import { type ReactNode, Suspense } from "react";
import { NavMarker } from "@/components/nav-marker";
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
                currentPagePath={null}
                currentSectionSlug={null}
                currentEssaySlug={null}
                footerAction={<MuteButton />}
              />
            }
          >
            <CurrentSidebar
              sections={library.sections}
              footerAction={<MuteButton />}
            />
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
