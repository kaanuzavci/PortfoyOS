"use client";

import { use } from "react";
import Link from "next/link";
import { usePortfolio } from "@/hooks/use-portfolio";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Change } from "@/components/shared/change";
import { StreakBadge } from "@/components/dashboard/streak-badge";
import { formatTRY, formatNumber } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/types";
import { ArrowLeft, PackageX } from "lucide-react";

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pf = usePortfolio();

  if (!pf.hydrated) return null;

  const pos = pf.positions.find((p) => p.assetId === id);
  if (!pos) {
    return (
      <EmptyState
        icon={PackageX}
        title="Varlık bulunamadı"
        description="Bu varlık silinmiş ya da hiç var olmamış olabilir."
        action={
          <Button asChild variant="outline">
            <Link href="/">Kontrol paneline dön</Link>
          </Button>
        }
      />
    );
  }

  const a = pos.asset;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft className="size-4" /> Geri
        </Link>
      </Button>

      <PageHeader
        title={a.name}
        description={`${a.ticker ?? ""} · ${ASSET_TYPE_LABELS[a.type]}${a.sector ? " · " + a.sector : ""}`}
        actions={<StreakBadge streak={pos.streak} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Güncel Değer" value={formatTRY(pos.currentValue)} />
        <Stat
          label="Toplam K/Z"
          value={formatTRY(pos.totalPnl)}
          extra={<Change value={pos.totalReturnPct} kind="percent" size="sm" />}
        />
        <Stat label="Ort. Maliyet" value={formatTRY(pos.avgCost)} />
        <Stat label="Adet" value={formatNumber(pos.heldUnits, 4)} />
      </div>

      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Detaylı fiyat grafiği, işlem tablosu ve journal Faz 6&apos;da
          eklenecek. Şu an pozisyon özeti gösteriliyor.
          {a.note && (
            <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-foreground">
              <span className="font-medium">Not: </span>
              {a.note}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular">{value}</p>
      {extra}
    </div>
  );
}
