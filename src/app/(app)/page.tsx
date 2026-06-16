"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, Coins, Percent, Activity, Plus } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import {
  computeBenchmarks,
  periodReturn,
  periodStart,
  type Period,
} from "@/lib/calc";
import { formatTRY, formatSignedTRY, formatPercent } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodToggle } from "@/components/dashboard/period-toggle";
import { ValueAreaChart } from "@/components/charts/value-area-chart";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import { MoversList } from "@/components/dashboard/movers-list";
import { StreakStrip } from "@/components/dashboard/streak-strip";
import { TopGainers } from "@/components/dashboard/top-gainers";
import { BenchmarkCard } from "@/components/dashboard/benchmark-card";
import { SeedButton } from "@/components/dashboard/seed-button";
import { Change } from "@/components/shared/change";
import { RefreshPricesButton } from "@/components/forms/refresh-prices-button";

export default function DashboardPage() {
  const pf = usePortfolio();
  const [period, setPeriod] = useState<Period>("1A");
  const [showCost, setShowCost] = useState(false);

  const filtered = useMemo(() => {
    if (!pf.series.length) return [];
    const start = periodStart(period, pf.now, pf.series);
    const data = pf.series.filter((p) => p.date >= start);
    return data.length >= 2 ? data : pf.series;
  }, [pf.series, period, pf.now]);

  const pr = useMemo(
    () =>
      periodReturn(
        pf.series,
        pf.raw.transactions,
        periodStart(period, pf.now, pf.series),
        pf.now,
      ),
    [pf.series, pf.raw.transactions, period, pf.now],
  );

  const benchmarks = useMemo(
    () => computeBenchmarks(pf.raw.transactions, pf.raw.macroSnapshots, pf.now),
    [pf.raw.transactions, pf.raw.macroSnapshots, pf.now],
  );

  const spark = useMemo(
    () => pf.series.slice(-30).map((p) => p.value),
    [pf.series],
  );

  if (!pf.hydrated) return <DashboardSkeleton />;

  if (pf.isEmpty) {
    return (
      <EmptyState
        icon={Wallet}
        title="İlk yatırımını ekle"
        description="Henüz varlık yok. Demo portföyünü yükleyerek tüm özellikleri hemen keşfet ya da kendi varlığını ekle."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <SeedButton />
            <Button asChild variant="outline">
              <Link href="/admin">
                <Plus className="size-4" /> Varlık ekle
              </Link>
            </Button>
          </div>
        }
        className="mt-8"
      />
    );
  }

  const s = pf.summary;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Maliyet bazlı anlık durum
        </p>
        <RefreshPricesButton variant="ghost" />
      </div>

      {/* KPI satırı */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Toplam Değer"
          value={s.totalValue}
          format={formatTRY}
          icon={Wallet}
          tone="accent"
          delta={{ value: s.dayChangePct, kind: "percent" }}
          subtext={`bugün ${formatSignedTRY(s.dayChange)}`}
          spark={spark}
        />
        <KpiCard
          index={1}
          label="Toplam Kâr/Zarar"
          value={s.totalPnl}
          format={formatSignedTRY}
          icon={Coins}
          tone={s.totalPnl >= 0 ? "gain" : "loss"}
          delta={{ value: s.totalReturnPct, kind: "percent" }}
          subtext="maliyete göre"
          hint="Gerçekleşen (sattıklarından) + gerçekleşmemiş (elindekilerden) kâr/zarar toplamı. (Güncel fiyat − ortalama maliyet) × adet mantığıyla hesaplanır."
        />
        <KpiCard
          index={2}
          label="Reel Getiri"
          value={s.realReturnPct}
          format={(n) => formatPercent(n)}
          icon={Percent}
          tone={s.realReturnPct >= 0 ? "gain" : "loss"}
          subtext={`enflasyon ${formatPercent(s.inflation)}`}
          hint="Enflasyondan arındırılmış gerçek getirin. Nominal getiri pozitif olsa bile enflasyon daha yüksekse reel getiri negatif olabilir. Makro veri (TÜFE) admin'den girilir."
        />
        <KpiCard
          index={3}
          label="Yıllık Getiri (XIRR)"
          value={s.xirr ?? 0}
          format={(n) => formatPercent(n)}
          icon={Activity}
          tone={(s.xirr ?? 0) >= 0 ? "gain" : "loss"}
          subtext="nakit akışı bazlı"
          hint="Düzensiz alış/satışları tarihleriyle dikkate alan yıllıklandırılmış getiri. Farklı zamanlarda para eklediğinde 'gerçek yıllık verim' budur."
        />
      </div>

      {/* Grafik + dağılım */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Portföy Değeri</CardTitle>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-xl font-semibold tabular">
                  {formatTRY(s.totalValue)}
                </span>
                <Change value={pr.pct} kind="percent" size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Switch
                  id="cost"
                  checked={showCost}
                  onCheckedChange={setShowCost}
                />
                <Label htmlFor="cost" className="text-xs text-muted-foreground">
                  Maliyet
                </Label>
              </div>
              <PeriodToggle value={period} onChange={setPeriod} />
            </div>
          </CardHeader>
          <CardContent>
            <ValueAreaChart data={filtered} showCost={showCost} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dağılım</CardTitle>
            <p className="text-xs text-muted-foreground">Varlık türüne göre</p>
          </CardHeader>
          <CardContent>
            <AllocationDonut data={pf.allocationByType} total={s.totalValue} />
          </CardContent>
        </Card>
      </div>

      {/* Son 7 günde en çok artanlar (sahip olunan + izleme listesi) */}
      <TopGainers
        assets={pf.raw.assets}
        snapshots={pf.raw.priceSnapshots}
        now={pf.now}
      />

      {/* Seriler */}
      <StreakStrip
        portfolioStreak={s.portfolioStreak}
        positions={pf.active}
      />

      {/* Movers + benchmark */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MoversList positions={pf.active} />
        </div>
        <BenchmarkCard
          benchmarks={benchmarks}
          portfolioReturn={s.totalReturnPct}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-2 text-center text-xs text-muted-foreground"
      >
        Bu uygulama takip/görselleştirme aracıdır; yatırım tavsiyesi vermez,
        vergi/getiri hesapları tahminidir.
      </motion.p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
