// Vergi/stopaj kaba tahmini — "bugün satarsam net ~X TL". Tavsiye DEĞİLDİR;
// oranlar config'ten ayarlanabilir. SAF.
import type { AssetType } from "@/types";

export type TaxRates = Record<AssetType, number>;

/** Kaba varsayılan stopaj/vergi oranları (yalnızca tahmin amaçlı). */
export const DEFAULT_TAX_RATES: TaxRates = {
  hisse: 0, // BIST pay senedi (bireysel) — güncel stopaj 0
  fon: 0.1,
  halka_arz: 0,
  altin: 0,
  doviz: 0,
  mevduat: 0.15,
  kripto: 0,
  diger: 0,
};

export interface TaxEstimate {
  taxableGain: number;
  tax: number;
  netIfSold: number; // güncel değer - vergi
}

export function estimateTax(
  type: AssetType,
  unrealizedGain: number,
  currentValue: number,
  rates: TaxRates = DEFAULT_TAX_RATES,
): TaxEstimate {
  const rate = rates[type] ?? 0;
  const taxableGain = Math.max(0, unrealizedGain);
  const tax = taxableGain * rate;
  return {
    taxableGain,
    tax,
    netIfSold: currentValue - tax,
  };
}
