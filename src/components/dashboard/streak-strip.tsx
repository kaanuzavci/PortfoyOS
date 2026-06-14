"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakBadge } from "./streak-badge";
import { InfoHint } from "@/components/shared/info-hint";
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
        <CardTitle className="flex items-center gap-1.5 text-base">
          Aktif seriler
          <InfoHint>
            Üst üste artış (kâr) veya azalış (zarar) günleri. 3 günde
            &quot;Kıvılcım/Dikkat&quot;, 5 günde &quot;Momentum/Uyarı&quot;…
            Yön değişince seri sıfırlanır.
          </InfoHint>
        </CardTitle>
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
