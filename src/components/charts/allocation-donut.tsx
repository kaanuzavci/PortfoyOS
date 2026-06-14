"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPercent, formatTRY } from "@/lib/format";
import type { AllocationSlice } from "@/lib/calc";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--info)",
];

export function AllocationDonut({
  data,
  total,
  height = 200,
}: {
  data: AllocationSlice[];
  total: number;
  height?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div style={{ height, width: height }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              animationDuration={700}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Toplam
          </span>
          <span className="font-mono text-sm font-semibold tabular">
            {formatTRY(total)}
          </span>
        </div>
      </div>

      <ul className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-1">
        {data.map((slice, i) => (
          <li key={slice.key} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="flex-1 truncate text-muted-foreground">
              {slice.label}
            </span>
            <span className="font-mono tabular text-foreground">
              {formatPercent(slice.pct)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: AllocationSlice }[];
}) {
  if (!active || !payload || !payload.length) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="font-medium">{slice.label}</p>
      <p className="font-mono tabular">{formatTRY(slice.value)}</p>
      <p className="text-muted-foreground">{formatPercent(slice.pct)}</p>
    </div>
  );
}
