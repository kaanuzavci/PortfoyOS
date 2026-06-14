"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Change } from "@/components/shared/change";
import type { BenchmarkResult } from "@/lib/calc";
import { cn } from "@/lib/utils";

export function BenchmarkCard({
  benchmarks,
  portfolioReturn,
}: {
  benchmarks: BenchmarkResult[];
  portfolioReturn: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kıyaslama</CardTitle>
        <p className="text-xs text-muted-foreground">
          Aynı parayı şuralara koysaydın
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium">Senin portföyün</span>
          <Change value={portfolioReturn} kind="percent" size="md" />
        </div>
        {benchmarks.map((b) => {
          const diff = portfolioReturn - b.returnPct;
          return (
            <div
              key={b.key}
              className="flex items-center justify-between px-3 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{b.label}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    diff >= 0
                      ? "bg-gain-soft text-gain"
                      : "bg-loss-soft text-loss",
                  )}
                >
                  {diff >= 0 ? "geçtin" : "geride"}
                </span>
              </div>
              <Change value={b.returnPct} kind="percent" size="sm" showIcon={false} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
