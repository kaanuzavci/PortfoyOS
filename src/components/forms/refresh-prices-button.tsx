"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePriceRefresh } from "@/hooks/use-price-refresh";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function RefreshPricesButton({
  variant = "outline",
  size = "sm",
  label = "Fiyatları güncelle",
}: {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default";
  label?: string;
}) {
  const { refresh, isFetching } = usePriceRefresh();

  const onClick = async () => {
    try {
      const r = await refresh();
      if (r.total === 0) {
        toast.info("Güncellenecek varlık yok", {
          description: "Varlıklara kod (ticker) ekli olmalı.",
        });
      } else if (r.updated === 0) {
        toast.warning("Fiyat çekilemedi", {
          description: "Kaynaklar yanıt vermedi; manuel girebilirsin.",
        });
      } else {
        toast.success(`${r.updated}/${r.total} fiyat güncellendi`, {
          description: r.skipped > 0 ? `${r.skipped} varlık atlandı.` : undefined,
        });
      }
    } catch {
      toast.error("Güncelleme başarısız", {
        description: "Bağlantıyı kontrol et; manuel giriş her zaman çalışır.",
      });
    }
  };

  return (
    <Button variant={variant} size={size} onClick={onClick} disabled={isFetching}>
      <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
      {isFetching ? "Güncelleniyor…" : label}
    </Button>
  );
}
