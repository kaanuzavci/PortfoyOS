"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { formatTRY, formatRelative } from "@/lib/format";
import { latestPriceOf } from "@/lib/calc";
import type { Asset } from "@/types";

/** Bir varlık için hızlı manuel fiyat güncelleme satırı. */
export function ManualPriceRow({ asset }: { asset: Asset }) {
  const snapshots = usePortfolioStore((s) => s.priceSnapshots);
  const setManualPrice = usePortfolioStore((s) => s.setManualPrice);
  const latest = latestPriceOf(asset.id, snapshots);
  const [value, setValue] = useState("");

  const save = () => {
    const n = Number(value);
    if (!(n > 0)) {
      toast.error("Geçerli bir fiyat gir");
      return;
    }
    setManualPrice(asset.id, n);
    setValue("");
    toast.success(`${asset.ticker || asset.name} fiyatı güncellendi`);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{asset.name}</p>
        <p className="text-xs text-muted-foreground">
          {latest
            ? `${formatTRY(latest.price)} · ${formatRelative(latest.date)}`
            : "Fiyat yok"}
        </p>
      </div>
      <Input
        type="number"
        step="any"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="Yeni fiyat"
        className="w-32 font-mono"
      />
      <Button size="icon" onClick={save} aria-label="Kaydet" disabled={!value}>
        <Check className="size-4" />
      </Button>
    </div>
  );
}
