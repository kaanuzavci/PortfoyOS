"use client";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ASSET_TYPE_LABELS, type AssetType } from "@/types";

const TYPES = Object.keys(ASSET_TYPE_LABELS) as AssetType[];

/** Tip bazında kaba vergi/stopaj oranları (yalnızca tahmin amaçlı). */
export function TaxRatesCard() {
  const taxRates = usePortfolioStore((s) => s.taxRates);
  const setTaxRate = usePortfolioStore((s) => s.setTaxRate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vergi / stopaj oranları</CardTitle>
        <p className="text-sm text-muted-foreground">
          &quot;Bugün satarsam net&quot; tahmininde kullanılır. Tavsiye değildir;
          kendi durumuna göre ayarla.
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TYPES.map((t) => (
          <div key={t} className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {ASSET_TYPE_LABELS[t]}
            </Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="any"
                value={((taxRates[t] ?? 0) * 100).toString()}
                onChange={(e) => setTaxRate(t, (Number(e.target.value) || 0) / 100)}
                className="h-8 font-mono"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
