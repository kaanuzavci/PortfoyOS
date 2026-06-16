"use client";

import { Button } from "@/components/ui/button";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { generateSeed } from "@/lib/demo/seed";
import { useHistoryBackfill } from "@/hooks/use-history-backfill";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function SeedButton({
  variant = "default",
  className,
}: {
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  const loadSeed = usePortfolioStore((s) => s.loadSeed);
  const { backfill } = useHistoryBackfill();

  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => {
        const data = generateSeed();
        loadSeed(data);
        toast.success("Demo portföyü yüklendi", {
          description: "Gerçekçi fiyatlar; gerçek geçmiş arka planda getiriliyor…",
        });
        // Gerçek fiyat geçmişini getir (kodlu/çekilebilir varlıklar için).
        backfill(data.assets, true).catch(() => {});
      }}
    >
      <Sparkles className="size-4" /> Demo verisi yükle
    </Button>
  );
}
