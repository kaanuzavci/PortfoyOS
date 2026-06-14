"use client";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OPTIONS: { key: "average" | "fifo"; label: string; desc: string }[] = [
  {
    key: "average",
    label: "Ağırlıklı ortalama",
    desc: "Satışta adetler o anki ortalama maliyetten düşülür. Basit ve yaygın (varsayılan).",
  },
  {
    key: "fifo",
    label: "FIFO (ilk giren ilk çıkar)",
    desc: "Satışta en eski alımların maliyeti düşülür. Vergi-odaklı gerçekleşen K/Z için daha uygun.",
  },
];

export function CostMethodCard() {
  const method = usePortfolioStore((s) => s.costMethod);
  const setMethod = usePortfolioStore((s) => s.setCostMethod);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Maliyet hesaplama yöntemi</CardTitle>
        <p className="text-sm text-muted-foreground">
          Kısmi satışlarda gerçekleşen kâr/zararın nasıl hesaplanacağı.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => setMethod(o.key)}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              method === o.key
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                method === o.key ? "border-primary" : "border-muted-foreground/40",
              )}
            >
              {method === o.key && <span className="size-2 rounded-full bg-primary" />}
            </span>
            <span>
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.desc}</span>
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
