"use client";

import { usePortfolio } from "@/hooks/use-portfolio";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { formatTRY, formatPercent, formatDate } from "@/lib/format";

export default function GoalsPage() {
  const pf = usePortfolio();
  const total = pf.summary.totalValue;

  return (
    <div>
      <PageHeader
        title="Hedefler"
        description="İlerleme çubuğu ve mevcut portföy değerine göre yakınlık."
      />
      {pf.raw.goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Hedef yok"
          description="Admin panelinden hedef ekleyebilirsin (ör. '1 Milyon ₺ portföy')."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pf.raw.goals.map((g) => {
            const ratio = g.targetAmount > 0 ? Math.min(1, total / g.targetAmount) : 0;
            return (
              <Card key={g.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{g.title}</p>
                    <span className="font-mono text-sm tabular text-primary">
                      {formatPercent(ratio)}
                    </span>
                  </div>
                  <Progress value={ratio * 100} className="mt-3" />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{formatTRY(total)}</span>
                    <span>{formatTRY(g.targetAmount)}</span>
                  </div>
                  {g.targetDate && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Hedef tarih: {formatDate(g.targetDate)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
