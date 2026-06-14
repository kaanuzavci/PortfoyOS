"use client";

import { Flame, Snowflake, TrendingDown } from "lucide-react";
import type { StreakResult } from "@/lib/calc";
import { cn } from "@/lib/utils";

/** Seri rozeti — kâr serisi alev, zarar serisi düşüş; seviye adı + gün. */
export function StreakBadge({
  streak,
  label,
  className,
}: {
  streak: StreakResult;
  label?: string;
  className?: string;
}) {
  if (streak.direction === "none" || streak.length < 1) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground",
          className,
        )}
      >
        <Snowflake className="size-3.5" />
        {label ? `${label}: ` : ""}Seri yok
      </span>
    );
  }

  const up = streak.direction === "up";
  const Icon = up ? Flame : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        up
          ? "border-warn/30 bg-warn-soft text-warn"
          : "border-loss/30 bg-loss-soft text-loss",
        streak.level && streak.level.level >= 4 && up && "animate-pulse-ring",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {label && <span className="text-foreground/70">{label}</span>}
      <span>
        {streak.level?.name ?? (up ? "Yükseliş" : "Düşüş")} · {streak.length}g
      </span>
    </span>
  );
}
