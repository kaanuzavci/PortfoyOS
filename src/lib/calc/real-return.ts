// Reel getiri — enflasyon (TÜFE) karşısında gerçek performans. (1+nominal)/(1+tüfe)−1
import type { MacroSnapshot } from "@/types";

/** İki tarih arasındaki TÜFE enflasyonu (kesir). En yakın <= snapshot'lar kullanılır. */
export function inflationBetween(
  macro: MacroSnapshot[],
  start: number,
  end: number,
): number {
  if (macro.length === 0) return 0;
  const sorted = [...macro].sort((a, b) => a.date - b.date);
  const startCpi = cpiAsOf(sorted, start) ?? sorted[0].cpiIndex;
  const endCpi = cpiAsOf(sorted, end) ?? sorted[sorted.length - 1].cpiIndex;
  if (startCpi <= 0) return 0;
  return endCpi / startCpi - 1;
}

function cpiAsOf(sorted: MacroSnapshot[], date: number): number | null {
  let res: number | null = null;
  for (const m of sorted) {
    if (m.date <= date) res = m.cpiIndex;
    else break;
  }
  if (res == null && sorted.length) return sorted[0].cpiIndex;
  return res;
}

/** Nominal getiriyi reel getiriye çevirir. */
export function realReturn(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}
