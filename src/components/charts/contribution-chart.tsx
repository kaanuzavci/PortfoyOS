"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTRY, formatTRYCompact } from "@/lib/format";
import type { AssetPosition } from "@/lib/calc";

/** Varlık katkı analizi — her varlığın toplam K/Z'ye katkısı (yatay bar). */
export function ContributionChart({
  positions,
  height = 300,
}: {
  positions: AssetPosition[];
  height?: number;
}) {
  const data = [...positions]
    .filter((p) => p.heldUnits > 0)
    .sort((a, b) => b.totalPnl - a.totalPnl)
    .map((p) => ({
      name: p.asset.ticker || p.asset.name,
      pnl: Math.round(p.totalPnl),
    }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v) => formatTRYCompact(v)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
                  <p className="font-medium">{payload[0].payload.name}</p>
                  <p
                    className={
                      payload[0].payload.pnl >= 0 ? "text-gain" : "text-loss"
                    }
                  >
                    {formatTRY(payload[0].payload.pnl)}
                  </p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="pnl" radius={4} isAnimationActive animationDuration={700}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.pnl >= 0 ? "var(--gain)" : "var(--loss)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
