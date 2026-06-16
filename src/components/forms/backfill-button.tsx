"use client";

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoryBackfill } from "@/hooks/use-history-backfill";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types";

/** "Geçmiş fiyatları getir" — gerçek geçmişi çekip grafiği doldurur/onarır. */
export function BackfillButton({
  asset,
  variant = "outline",
  size = "sm",
  replace = true,
  label = "Geçmişi getir",
}: {
  asset?: Asset;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default";
  replace?: boolean;
  label?: string;
}) {
  const { backfill, isBackfilling } = useHistoryBackfill();

  const onClick = async () => {
    try {
      const r = await backfill(asset ? [asset] : undefined, replace);
      if (r.total === 0) {
        toast.info("Geçmiş çekilecek varlık yok", {
          description: "Kodlu (hisse/döviz/kripto/altın) varlık gerekir.",
        });
      } else if (r.filled === 0) {
        toast.warning("Geçmiş alınamadı", {
          description: "Kaynak yanıt vermedi; biraz sonra tekrar dene.",
        });
      } else {
        toast.success(`${r.filled} varlık için gerçek geçmiş yüklendi`);
      }
    } catch {
      toast.error("Geçmiş getirilemedi", {
        description: "Bağlantıyı kontrol et; manuel giriş her zaman çalışır.",
      });
    }
  };

  return (
    <Button variant={variant} size={size} onClick={onClick} disabled={isBackfilling}>
      <History className={cn("size-4", isBackfilling && "animate-spin")} />
      {isBackfilling ? "Getiriliyor…" : label}
    </Button>
  );
}
