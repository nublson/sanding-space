import Link from "next/link";
import { INTRODUCTION } from "@/lib/introduction";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-heading text-balance text-[32px]/[38px] tracking-[-0.015em] text-foreground">
        Not found
      </h1>
      <p className="measure text-base/[26px] text-muted-foreground">
        That page isn&rsquo;t here, or it isn&rsquo;t published yet.
      </p>
      <Link
        href={INTRODUCTION.path}
        className="link w-fit text-[13px] underline decoration-from-font underline-offset-4"
      >
        Back to the introduction
      </Link>
    </div>
  );
}
