"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Change } from "@/components/shared/change";
import { InfoHint } from "@/components/shared/info-hint";
import { TransactionForm } from "@/components/forms/transaction-form";
import { latestPriceOf, priceChangePct } from "@/lib/calc";
import { formatTRY } from "@/lib/format";
import { ASSET_TYPE_LABELS, type Asset, type PriceSnapshot } from "@/types";
import { TrendingUp, ShoppingCart } from "lucide-react";

/** Son 7 günde en çok artanlar — sahip olunan + izleme listesi varlıkları. */
export function TopGainers({
  assets,
  snapshots,
  now,
}: {
  assets: Asset[];
  snapshots: PriceSnapshot[];
  now: number;
}) {
  const rows = useMemo(() => {
    return assets
      .filter((a) => !a.isArchived && a.ticker)
      .map((a) => {
        const ch = priceChangePct(snapshots, a.id, 7, now);
        const latest = latestPriceOf(a.id, snapshots);
        return { asset: a, ch, price: latest?.price ?? 0 };
      })
      .filter((r) => r.ch.hasData)
      .sort((a, b) => b.ch.changePct - a.ch.changePct)
      .slice(0, 6);
  }, [assets, snapshots, now]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <TrendingUp className="size-4 text-gain" />
          Son 7 günde en çok artanlar
          <InfoHint>
            Sahip olduğun ve izleme listendeki varlıkların son 7 günlük fiyat
            değişimi. Yükselenleri görüp tek tıkla alabilirsin.
          </InfoHint>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Henüz 7 günlük veri yok. Varlık ekle veya{" "}
            <Link href="/watchlist" className="text-primary hover:underline">
              izleme listesine
            </Link>{" "}
            bir şeyler koy; fiyat geçmişi geldikçe burada sıralanır.
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.map(({ asset, ch, price }) => (
              <li
                key={asset.id}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40"
              >
                <Link
                  href={`/asset/${asset.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-[11px] font-semibold">
                    {(asset.ticker || asset.name).slice(0, 4).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {asset.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {ASSET_TYPE_LABELS[asset.type]}
                      {asset.isWatchlist ? " · izleme" : ""} · {formatTRY(price)}
                    </span>
                  </span>
                </Link>
                <Change value={ch.changePct} kind="percent" size="sm" />
                <TransactionForm
                  defaultAssetId={asset.id}
                  trigger={
                    <Button size="icon" variant="ghost" className="size-8" aria-label="Satın al">
                      <ShoppingCart className="size-4" />
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
