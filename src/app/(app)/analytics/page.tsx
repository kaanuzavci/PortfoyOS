"use client";

import { useMemo } from "react";
import { ChartLine } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { computeBenchmarks, inflationBetween } from "@/lib/calc";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SeedButton } from "@/components/dashboard/seed-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarHeatmap } from "@/components/charts/calendar-heatmap";
import { NominalRealChart } from "@/components/charts/nominal-real-chart";
import { ContributionChart } from "@/components/charts/contribution-chart";
import { BenchmarkCard } from "@/components/dashboard/benchmark-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const pf = usePortfolio();

  const nominalReal = useMemo(() => {
    if (!pf.series.length) return [];
    const start = pf.series[0].date;
    return pf.series.map((p) => {
      const infl = inflationBetween(pf.raw.macroSnapshots, start, p.date);
      return {
        date: p.date,
        nominal: p.value,
        real: p.value / (1 + infl),
      };
    });
  }, [pf.series, pf.raw.macroSnapshots]);

  const benchmarks = useMemo(
    () => computeBenchmarks(pf.raw.transactions, pf.raw.macroSnapshots, pf.now),
    [pf.raw.transactions, pf.raw.macroSnapshots, pf.now],
  );

  if (!pf.hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (pf.isEmpty) {
    return (
      <div>
        <PageHeader title="Analizler" />
        <EmptyState
          icon={ChartLine}
          title="Analiz için veri yok"
          description="Önce varlık ve işlem ekle ya da demo verisini yükle."
          action={<SeedButton />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analizler"
        description="Günlük getiri ısı haritası, nominal vs reel, varlık katkısı ve kıyaslama."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Günlük getiri ısı haritası</CardTitle>
          <p className="text-xs text-muted-foreground">
            Her kare bir günün portföy getirisi — koyu yeşil güçlü kazanç, koyu
            kırmızı güçlü kayıp.
          </p>
        </CardHeader>
        <CardContent>
          <CalendarHeatmap series={pf.series} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Nominal vs Reel değer</CardTitle>
            <p className="text-xs text-muted-foreground">
              Reel = enflasyondan arındırılmış (— — kesikli çizgi).
            </p>
          </CardHeader>
          <CardContent>
            <NominalRealChart data={nominalReal} />
          </CardContent>
        </Card>

        <BenchmarkCard
          benchmarks={benchmarks}
          portfolioReturn={pf.summary.totalReturnPct}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Varlık katkı analizi</CardTitle>
          <p className="text-xs text-muted-foreground">
            Her varlığın toplam kâr/zarara katkısı.
          </p>
        </CardHeader>
        <CardContent>
          <ContributionChart positions={pf.active} />
        </CardContent>
      </Card>
    </div>
  );
}
