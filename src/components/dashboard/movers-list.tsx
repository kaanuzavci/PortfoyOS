"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Change } from "@/components/shared/change";
import { rankMovers, type AssetPosition } from "@/lib/calc";
import { formatTRY } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export function MoversList({ positions }: { positions: AssetPosition[] }) {
  const [by, setBy] = useState<"pct" | "abs">("pct");
  const ranked = rankMovers(positions, by);
  const gainers = ranked.filter((p) => p.unrealizedPnl > 0).slice(0, 4);
  const losers = ranked
    .filter((p) => p.unrealizedPnl < 0)
    .slice(-4)
    .reverse();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">En çok hareket edenler</CardTitle>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
          {(["pct", "abs"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setBy(m)}
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                by === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "pct" ? "%" : "₺"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <MoverColumn
          title="Kazandıranlar"
          icon={<TrendingUp className="size-4 text-gain" />}
          items={gainers}
          by={by}
          empty="Henüz kazançlı varlık yok."
        />
        <MoverColumn
          title="Kaybettirenler"
          icon={<TrendingDown className="size-4 text-loss" />}
          items={losers}
          by={by}
          empty="Zararda varlık yok 🎉"
        />
      </CardContent>
    </Card>
  );
}

function MoverColumn({
  title,
  icon,
  items,
  by,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: AssetPosition[];
  by: "pct" | "abs";
  empty: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((p) => (
            <li key={p.assetId}>
              <Link
                href={`/asset/${p.assetId}`}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-[11px] font-semibold">
                  {(p.asset.ticker || p.asset.name).slice(0, 3).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.asset.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ASSET_TYPE_LABELS[p.asset.type]} · {formatTRY(p.currentValue)}
                  </p>
                </div>
                <Change
                  value={by === "pct" ? p.unrealizedPnlPct : p.unrealizedPnl}
                  kind={by === "pct" ? "percent" : "currency"}
                  size="sm"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
