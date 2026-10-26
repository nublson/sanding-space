import Link from "next/link";
import { INTRODUCTION } from "@/lib/introduction";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-heading text-balance text-[32px]/[38px] tracking-[-0.015em] text-foreground max-md:text-[28px]/[34px]">
        Not found
      </h1>
      <p className="text-muted-foreground">
        That page isn&rsquo;t here, or it isn&rsquo;t published yet.
      </p>
      <Link
        href={INTRODUCTION.path}
        className="link w-fit text-sm underline decoration-from-font underline-offset-4 max-md:text-[13px]"
      >
        Back to the introduction
      </Link>
    </div>
  );
}
