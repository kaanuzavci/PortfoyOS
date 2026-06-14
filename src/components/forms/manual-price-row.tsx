"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { usePriceRefresh } from "@/hooks/use-price-refresh";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StaleBadge } from "@/components/shared/stale-badge";
import { Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatTRY, formatRelative, formatSignedPercent } from "@/lib/format";
import { latestPriceOf } from "@/lib/calc";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types";

type Mode = "auto" | "spread" | "manual";

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: "auto", label: "Otomatik", hint: "Piyasa fiyatı otomatik çekilir." },
  {
    key: "spread",
    label: "Banka makası",
    hint: "Piyasa fiyatına öğrenilen banka makası uygulanır. Bankanın güncel fiyatını (hafta içi gündüz) girip 'Kalibre et'e bas.",
  },
  { key: "manual", label: "Manuel", hint: "Fiyatı yalnızca elle girersin; otomatik dokunmaz." },
];

export function ManualPriceRow({ asset }: { asset: Asset }) {
  const snapshots = usePortfolioStore((s) => s.priceSnapshots);
  const setManualPrice = usePortfolioStore((s) => s.setManualPrice);
  const updateAsset = usePortfolioStore((s) => s.updateAsset);
  const { calibrate, isFetching } = usePriceRefresh();
  const latest = latestPriceOf(asset.id, snapshots);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const mode: Mode = asset.priceMode ?? "auto";
  const isSpread = mode === "spread";

  const save = async () => {
    const n = Number(value);
    if (!(n > 0)) {
      toast.error("Geçerli bir fiyat gir");
      return;
    }
    if (isSpread) {
      setBusy(true);
      try {
        const pct = await calibrate(asset, n);
        toast.success(`${asset.ticker || asset.name} kalibre edildi`, {
          description: `Banka makası: ${formatSignedPercent(pct)} (piyasaya göre)`,
        });
        setValue("");
      } catch {
        toast.error("Kalibrasyon başarısız", {
          description: "Piyasa fiyatı alınamadı; biraz sonra tekrar dene.",
        });
      } finally {
        setBusy(false);
      }
    } else {
      setManualPrice(asset.id, n);
      setValue("");
      toast.success(`${asset.ticker || asset.name} fiyatı güncellendi`);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{asset.name}</p>
            <StaleBadge latestDate={latest?.date ?? null} />
          </div>
          <p className="text-xs text-muted-foreground">
            {latest
              ? `${formatTRY(latest.price)} · ${formatRelative(latest.date)}`
              : "Fiyat yok"}
            {isSpread && typeof asset.spreadPct === "number" && (
              <span className="ml-1 text-warn">
                · makas {formatSignedPercent(asset.spreadPct)}
              </span>
            )}
          </p>
        </div>
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder={isSpread ? "Bankanın fiyatı" : "Yeni fiyat"}
          className="w-32 font-mono"
        />
        <Button
          size="icon"
          onClick={save}
          aria-label={isSpread ? "Kalibre et" : "Kaydet"}
          disabled={!value || busy || isFetching}
          title={isSpread ? "Kalibre et" : "Kaydet"}
        >
          {isSpread ? (
            <RefreshCw className={cn("size-4", (busy || isFetching) && "animate-spin")} />
          ) : (
            <Check className="size-4" />
          )}
        </Button>
      </div>

      {/* Mod seçimi */}
      <div className="mt-2 flex items-center gap-2">
        <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => updateAsset(asset.id, { priceMode: m.key })}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                mode === m.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="hidden text-[11px] text-muted-foreground sm:block">
          {MODES.find((m) => m.key === mode)?.hint}
        </p>
      </div>
    </div>
  );
}
