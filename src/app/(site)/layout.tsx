import Link from "next/link";
import type { ReactNode } from "react";
import { MobileShell } from "@/components/sidebar/mobile-shell";
import { ScrollSpy } from "@/components/sidebar/scroll-spy";
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
      <MobileShell
        sidebar={
          <ScrollSpy
            sections={library.sections}
            footer={
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
            }
          />
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
