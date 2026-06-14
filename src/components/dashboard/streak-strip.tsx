"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakBadge } from "./streak-badge";
import type { AssetPosition, StreakResult } from "@/lib/calc";

export function StreakStrip({
  portfolioStreak,
  positions,
}: {
  portfolioStreak: StreakResult;
  positions: AssetPosition[];
}) {
  const active = positions
    .filter((p) => p.heldUnits > 0 && p.streak.direction !== "none" && p.streak.length >= 2)
    .sort((a, b) => b.streak.length - a.streak.length)
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aktif seriler</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <StreakBadge streak={portfolioStreak} label="Portföy" />
        {active.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            Varlık bazında aktif seri yok.
          </span>
        ) : (
          active.map((p) => (
            <Link key={p.assetId} href={`/asset/${p.assetId}`}>
              <StreakBadge
                streak={p.streak}
                label={p.asset.ticker || p.asset.name.slice(0, 6)}
              />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
