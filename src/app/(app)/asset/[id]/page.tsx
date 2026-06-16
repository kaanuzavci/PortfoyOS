"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { usePortfolio } from "@/hooks/use-portfolio";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Change } from "@/components/shared/change";
import { StreakBadge } from "@/components/dashboard/streak-badge";
import { ValueAreaChart } from "@/components/charts/value-area-chart";
import { TransactionForm } from "@/components/forms/transaction-form";
import { RefreshPricesButton } from "@/components/forms/refresh-prices-button";
import { BackfillButton } from "@/components/forms/backfill-button";
import { StaleBadge } from "@/components/shared/stale-badge";
import { TaxEstimateCard } from "@/components/asset/tax-estimate-card";
import { snapTryPrice } from "@/lib/calc";
import { formatTRY, formatNumber, formatDate } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/types";
import { ArrowLeft, PackageX, Plus, Target, ShieldAlert } from "lucide-react";

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pf = usePortfolio();
  const transactions = usePortfolioStore((s) => s.transactions);
  const snapshots = usePortfolioStore((s) => s.priceSnapshots);

  const pos = pf.positions.find((p) => p.assetId === id);

  const priceSeries = useMemo(
    () =>
      snapshots
        .filter((s) => s.assetId === id)
        .map((s) => ({ date: s.date, value: snapTryPrice(s), costBasis: pos?.avgCost ?? 0 }))
        .sort((a, b) => a.date - b.date),
    [snapshots, id, pos?.avgCost],
  );

  const assetTxs = useMemo(
    () =>
      transactions
        .filter((t) => t.assetId === id)
        .sort((a, b) => b.date - a.date),
    [transactions, id],
  );

  if (!pf.hydrated) return null;

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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StreakBadge streak={pos.streak} />
            <BackfillButton asset={a} variant="outline" />
            <RefreshPricesButton variant="outline" />
            <TransactionForm
              defaultAssetId={a.id}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" /> İşlem
                </Button>
              }
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Güncel Değer" value={formatTRY(pos.currentValue)} />
        <Stat
          label="Toplam K/Z"
          value={formatTRY(pos.totalPnl)}
          extra={<Change value={pos.totalReturnPct} kind="percent" size="sm" />}
        />
        <Stat label="Ort. Maliyet" value={formatTRY(pos.avgCost)} />
        <Stat
          label="Güncel Fiyat"
          value={formatTRY(pos.latestPrice)}
          extra={<StaleBadge latestDate={pos.latestPriceDate} />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Fiyat geçmişi</CardTitle>
          <span className="text-xs text-muted-foreground">
            — — ortalama maliyet
          </span>
        </CardHeader>
        <CardContent>
          {priceSeries.length >= 2 ? (
            <ValueAreaChart data={priceSeries} showCost height={260} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Grafik için en az iki fiyat kaydı gerekir. Admin&apos;den fiyat ekle.
            </p>
          )}
        </CardContent>
      </Card>

      {(a.targetPrice || a.stopLossPrice || a.note) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {a.targetPrice && (
            <InfoChip
              icon={<Target className="size-4 text-gain" />}
              label="Hedef"
              value={formatTRY(a.targetPrice)}
            />
          )}
          {a.stopLossPrice && (
            <InfoChip
              icon={<ShieldAlert className="size-4 text-loss" />}
              label="Stop-loss"
              value={formatTRY(a.stopLossPrice)}
            />
          )}
          {a.note && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm sm:col-span-3">
              <span className="font-medium">Karar notu: </span>
              {a.note}
            </div>
          )}
        </div>
      )}

      <TaxEstimateCard position={pos} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          {assetTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground">İşlem yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Tarih</TableHead>
                  <TableHead>Yön</TableHead>
                  <TableHead className="text-right">Adet</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetTxs.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs tabular text-muted-foreground">
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.side === "buy"
                            ? "border-gain/30 bg-gain-soft text-gain"
                            : "border-loss/30 bg-loss-soft text-loss"
                        }
                      >
                        {t.side === "buy" ? "Alış" : "Satış"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular">
                      {formatNumber(t.units, 4)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular">
                      {formatTRY(t.pricePerUnit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-sm font-semibold tabular">{value}</p>
      </div>
    </div>
  );
}
