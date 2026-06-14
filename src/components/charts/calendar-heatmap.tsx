"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface DayCell {
  date: number;
  ret: number | null;
}

/** GitHub tarzı günlük getiri ısı haritası (kazanç emerald, kayıp rose). */
export function CalendarHeatmap({
  series,
  weeks = 18,
}: {
  series: { date: number; value: number }[];
  weeks?: number;
}) {
  const { grid, maxAbs } = useMemo(() => {
    // Günlük getiri haritası
    const retByDay = new Map<string, number>();
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1].value;
      const ret = prev > 0 ? (series[i].value - prev) / prev : 0;
      retByDay.set(dayKey(series[i].date), ret);
    }
    let maxAbs = 0;
    for (const r of retByDay.values()) maxAbs = Math.max(maxAbs, Math.abs(r));
    if (maxAbs === 0) maxAbs = 0.01;

    // Son N hafta — Pazartesi başlangıçlı
    const end = series.length ? series[series.length - 1].date : Date.now();
    const endMonday = startOfWeek(end);
    const start = endMonday - (weeks - 1) * 7 * DAY;

    const cols: DayCell[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = start + w * 7 * DAY + d * DAY;
        const key = dayKey(date);
        col.push({ date, ret: retByDay.has(key) ? retByDay.get(key)! : null });
      }
      cols.push(col);
    }
    return { grid: cols, maxAbs };
  }, [series, weeks]);

  const color = (ret: number | null): string => {
    if (ret == null) return "var(--muted)";
    const t = Math.min(1, Math.abs(ret) / maxAbs);
    const alpha = 0.18 + t * 0.82;
    return ret >= 0
      ? `color-mix(in oklch, var(--gain) ${Math.round(alpha * 100)}%, var(--muted))`
      : `color-mix(in oklch, var(--loss) ${Math.round(alpha * 100)}%, var(--muted))`;
  };

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between gap-[3px] pt-0.5 text-[9px] text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <span key={d} className={cn("h-3 leading-3", i % 2 === 1 && "opacity-0")}>
            {d}
          </span>
        ))}
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {grid.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <Tooltip key={cell.date}>
                <TooltipTrigger asChild>
                  <div
                    className="size-3 rounded-[3px] transition-transform hover:scale-125"
                    style={{ background: color(cell.ret) }}
                  />
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p className="font-medium">{formatDate(cell.date)}</p>
                  <p
                    className={cn(
                      "font-mono tabular",
                      cell.ret != null && cell.ret >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {cell.ret == null ? "Veri yok" : formatSignedPercent(cell.ret, 2)}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Pazartesi = 0
  return d.getTime() - dow * DAY;
}
