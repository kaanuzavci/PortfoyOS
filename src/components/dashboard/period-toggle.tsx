"use client";

import { PERIODS, PERIOD_LABELS, type Period } from "@/lib/calc";
import { cn } from "@/lib/utils";

export function PeriodToggle({
  value,
  onChange,
  className,
}: {
  value: Period;
  onChange: (p: Period) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5",
        className,
      )}
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === p
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p === "TUM" ? "Tüm" : p}
        </button>
      ))}
      <span className="sr-only">{PERIOD_LABELS[value]}</span>
    </div>
  );
}
