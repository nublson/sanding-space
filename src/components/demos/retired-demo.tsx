import Link from "next/link";

export function RetiredDemo({ essay }: { essay?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center text-sm">
      <p className="font-medium">This demo has moved</p>
      <Link
        href={essay ? `/${essay}` : "/"}
        target="_blank"
        rel="noopener"
        className="text-muted-foreground underline underline-offset-4"
      >
        {essay ? "Read the essay" : "Visit Sanding Space"}
        <span className="sr-only"> (opens in a new tab)</span>
      </Link>
    </div>
  );
}
