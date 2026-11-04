"use client";

import { Copy } from "lucide-react";
import { CopyButton } from "@/components/share/copy-button";

/** The code block's copy button: a server component can pass the text, not a function. */
export function CopyCode({ code }: { code: string }) {
  return (
    <CopyButton
      label="Copy code"
      failedLabel="Couldn't copy the code. Try again"
      icon={Copy}
      source={() => code}
      className="text-subtle-foreground pointer-coarse:size-11"
    />
  );
}
