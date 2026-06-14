"use client";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/shared/info-hint";
import { estimateTax } from "@/lib/calc";
import { formatTRY, formatPercent } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/types";
import type { AssetPosition } from "@/lib/calc";

/** "Bugün satarsam net ~X ₺" — kaba vergi/stopaj tahmini (tavsiye değildir). */
export function TaxEstimateCard({ position }: { position: AssetPosition }) {
  const taxRates = usePortfolioStore((s) => s.taxRates);
  if (position.heldUnits <= 0) return null;

  const rate = taxRates[position.asset.type] ?? 0;
  const est = estimateTax(
    position.asset.type,
    position.unrealizedPnl,
    position.currentValue,
    taxRates,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          Bugün satarsam
          <InfoHint>
            Kaba bir tahmindir, yatırım/vergi tavsiyesi değildir. Oran
            varsayılandır; Ayarlar&apos;dan değiştirebilirsin. Gerçek vergi;
            elde tutma süresi, istisnalar vb. ile değişir.
          </InfoHint>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1.5 text-sm">
          <Row label="Güncel değer" value={formatTRY(position.currentValue)} />
          <Row
            label="Vergilenebilir kazanç"
            value={formatTRY(est.taxableGain)}
          />
          <Row
            label={`Tahmini vergi (${ASSET_TYPE_LABELS[position.asset.type]} %${(rate * 100).toFixed(0)})`}
            value={`− ${formatTRY(est.tax)}`}
            tone="loss"
          />
          <div className="!mt-3 flex items-center justify-between border-t border-border pt-2">
            <dt className="font-medium">Net (tahmini)</dt>
            <dd className="font-mono text-base font-semibold tabular">
              {formatTRY(est.netIfSold)}
            </dd>
          </div>
        </dl>
        {rate === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Bu varlık türü için varsayılan oran %0 (
            {formatPercent(0, 0)}). Ayarlar → Vergi oranlarından değiştirebilirsin.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "loss";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-mono tabular ${tone === "loss" ? "text-loss" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
