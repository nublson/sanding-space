import type { ReactNode } from "react";

// The root layout renders <html class="dark">; the demo wrapper carries the
// theme, so the document itself must stay transparent.
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{"html,body{background:transparent}"}</style>
      {children}
    </>
  );
}
