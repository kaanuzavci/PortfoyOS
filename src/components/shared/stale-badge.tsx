"use client";

import { AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

/** Son fiyat snapshot'ı eskiyse "güncel değil" rozeti gösterir. */
export function StaleBadge({
  latestDate,
  thresholdDays = 4,
  className,
}: {
  latestDate: number | null;
  thresholdDays?: number;
  className?: string;
}) {
  if (latestDate == null) return null;
  const age = Date.now() - latestDate;
  if (age < thresholdDays * DAY) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-warn/30 bg-warn-soft px-1.5 py-0.5 text-[10px] font-medium text-warn",
            className,
          )}
        >
          <AlertTriangle className="size-3" />
          güncel değil
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        Son fiyat {formatRelative(latestDate)}. Admin → Fiyatlar&apos;dan güncelle
        veya &quot;Fiyatları güncelle&quot;ye bas.
      </TooltipContent>
    </Tooltip>
  );
}
