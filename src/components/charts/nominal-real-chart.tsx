"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatTRY, formatTRYCompact } from "@/lib/format";

export interface NominalRealPoint {
  date: number;
  nominal: number;
  real: number;
}

/** Nominal vs reel (enflasyondan arındırılmış) portföy değeri. */
export function NominalRealChart({
  data,
  height = 280,
}: {
  data: NominalRealPoint[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
                  <p className="mb-1 font-medium text-muted-foreground">
                    {formatDate(label as number)}
                  </p>
                  <p className="font-mono tabular">
                    Nominal: {formatTRY(payload.find((p) => p.dataKey === "nominal")?.value as number)}
                  </p>
                  <p className="font-mono tabular text-info">
                    Reel: {formatTRY(payload.find((p) => p.dataKey === "real")?.value as number)}
                  </p>
                </div>
              ) : null
            }
          />
          <Line
            type="monotone"
            dataKey="nominal"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="real"
            stroke="var(--info)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
