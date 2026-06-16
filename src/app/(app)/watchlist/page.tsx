"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { useHistoryBackfill } from "@/hooks/use-history-backfill";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionForm } from "@/components/forms/transaction-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Change } from "@/components/shared/change";
import { latestPriceOf, priceChangePct } from "@/lib/calc";
import { formatTRY } from "@/lib/format";
import { ASSET_TYPE_LABELS, type AssetType } from "@/types";
import { Eye, Plus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const ADD_TYPES: AssetType[] = ["hisse", "altin", "doviz", "kripto"];

export default function WatchlistPage() {
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const assets = usePortfolioStore((s) => s.assets);
  const snapshots = usePortfolioStore((s) => s.priceSnapshots);
  const addAsset = usePortfolioStore((s) => s.addAsset);
  const deleteAsset = usePortfolioStore((s) => s.deleteAsset);
  const { backfill } = useHistoryBackfill();

  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<AssetType>("hisse");

  const watch = useMemo(
    () => assets.filter((a) => a.isWatchlist && !a.isArchived),
    [assets],
  );

  const now = useMemo(() => {
    const dates = snapshots.map((s) => s.date);
    return dates.length ? Math.max(Date.now(), ...dates) : Date.now();
  }, [snapshots]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) {
      toast.error("Kod (ticker) gerekli");
      return;
    }
    const created = addAsset({
      name: name.trim() || ticker.trim().toUpperCase(),
      ticker: ticker.trim().toUpperCase(),
      type,
      currency: "TRY",
      priceSource: "manuel",
      isWatchlist: true,
    });
    backfill([created], false).catch(() => {});
    toast.success(`${created.ticker} izlemeye alındı`, {
      description: "Fiyat ve geçmiş arka planda getiriliyor…",
    });
    setName("");
    setTicker("");
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="İzleme Listesi"
        description="Henüz almadığın ama takip ettiğin varlıklar. Fiyatları otomatik çekilir; yükseleni görüp tek tıkla alırsın."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Takibe ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="w-ticker">Kod</Label>
              <Input
                id="w-ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="THYAO"
                className="w-32"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-name">Ad (opsiyonel)</Label>
              <Input
                id="w-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Türk Hava Yolları"
                className="w-48"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ASSET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">
              <Plus className="size-4" /> Ekle
            </Button>
          </form>
        </CardContent>
      </Card>

      {watch.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="İzleme listen boş"
          description="Yukarıdan ilgilendiğin bir hisse/altın/döviz/kripto ekle. Fiyatı çekilir, son 7 günlük değişimini görürsün."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {watch.map((a) => {
            const latest = latestPriceOf(a.id, snapshots);
            const ch = priceChangePct(snapshots, a.id, 7, now);
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/asset/${a.id}`} className="min-w-0">
                      <p className="truncate font-semibold hover:underline">
                        {a.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.ticker} · {ASSET_TYPE_LABELS[a.type]}
                      </p>
                    </Link>
                    <button
                      onClick={() => deleteAsset(a.id)}
                      className="text-muted-foreground hover:text-loss"
                      aria-label="Listeden çıkar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="font-mono text-lg font-semibold tabular">
                        {latest ? formatTRY(latest.price) : "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">7 gün</p>
                    </div>
                    {ch.hasData ? (
                      <Change value={ch.changePct} kind="percent" size="md" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        veri birikiyor
                      </span>
                    )}
                  </div>

                  <TransactionForm
                    defaultAssetId={a.id}
                    trigger={
                      <Button size="sm" variant="outline" className="mt-3 w-full">
                        <ShoppingCart className="size-4" /> Satın al
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
