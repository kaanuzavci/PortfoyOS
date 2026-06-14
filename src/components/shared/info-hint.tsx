"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Bir alanın/metrik başlığının yanına konan küçük açıklama ipucu. */
export function InfoHint({
  children,
  className,
  side = "top",
}: {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Açıklama"
          onClick={(e) => e.preventDefault()}
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground",
            className,
          )}
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[240px] text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
