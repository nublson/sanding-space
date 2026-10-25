import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { MobileShell } from "@/components/sidebar/mobile-shell";
import { ScrollSpy } from "@/components/sidebar/scroll-spy";
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
        className="link flex h-7 items-center text-sm pointer-coarse:h-11"
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
                currentSectionSlug={null}
                currentEssaySlug={null}
                footer={footer}
              />
            }
          >
            <ScrollSpy sections={library.sections} footer={footer} />
          </Suspense>
        }
      >
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[672px] px-4 pt-[88px] pb-24 outline-none md:px-0 md:pt-8"
        >
          {children}
        </main>
      </MobileShell>
    </SoundRoot>
  );
}
