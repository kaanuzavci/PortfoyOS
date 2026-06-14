"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatTRY, formatTRYCompact } from "@/lib/format";

export interface ValueChartPoint {
  date: number;
  value: number;
  costBasis?: number;
}

export function ValueAreaChart({
  data,
  height = 280,
  showCost = false,
  color = "var(--chart-1)",
}: {
  data: ValueChartPoint[];
  height?: number;
  showCost?: boolean;
  color?: string;
}) {
  const positive =
    data.length >= 2 ? data[data.length - 1].value >= data[0].value : true;
  const stroke = color;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => formatDate(v).slice(0, 5)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            tickFormatter={(v) => formatTRYCompact(v)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={64}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<ChartTooltip showCost={showCost} />} />
          {showCost && (
            <Area
              type="monotone"
              dataKey="costBasis"
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="none"
              dot={false}
              isAnimationActive={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#valueFill)"
            dot={false}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      <span className="sr-only">
        {positive ? "Yükseliş eğilimi" : "Düşüş eğilimi"}
      </span>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: number;
  showCost?: boolean;
}

function ChartTooltip({ active, payload, label, showCost }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload.find((p) => p.dataKey === "value")?.value;
  const cost = payload.find((p) => p.dataKey === "costBasis")?.value;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-medium text-muted-foreground">
        {formatDate(label)}
      </p>
      <p className="font-mono font-semibold tabular">
        {formatTRY(value ?? 0)}
      </p>
      {showCost && cost != null && (
        <p className="mt-0.5 font-mono text-muted-foreground tabular">
          Maliyet: {formatTRY(cost)}
        </p>
      )}
    </div>
  );
}
