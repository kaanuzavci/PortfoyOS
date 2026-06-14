// Benchmark — aynı nakit akışlarını BIST100 / gram altın / mevduata uygulayıp
// sanal getiriyle kıyaslar ("altını +%X geçtin"). SAF.
import type { Transaction, MacroSnapshot } from "@/types";
import { txTryPrice } from "./position";

const DAY = 86_400_000;

export interface BenchmarkResult {
  key: "bist100" | "gramGold" | "usd" | "deposit";
  label: string;
  /** Sanal getiri (kesir) */
  returnPct: number;
  currentValue: number;
  invested: number;
}

interface PricePoint {
  date: number;
  price: number;
}

function macroSeries(
  macro: MacroSnapshot[],
  field: "bist100" | "gramGold" | "usdTry",
): PricePoint[] {
  return [...macro]
    .sort((a, b) => a.date - b.date)
    .map((m) => ({ date: m.date, price: m[field] }));
}

function priceAsOf(points: PricePoint[], date: number): number | null {
  let res: number | null = points.length ? points[0].price : null;
  for (const p of points) {
    if (p.date <= date) res = p.price;
    else break;
  }
  return res;
}

/** Aynı nakit akışlarını bir fiyat serisine uygular, güncel sanal değeri döndürür. */
function applyFlowsToBenchmark(
  transactions: Transaction[],
  points: PricePoint[],
  now: number,
): { value: number; invested: number; returnPct: number } {
  if (points.length === 0) return { value: 0, invested: 0, returnPct: 0 };
  let units = 0;
  let invested = 0;
  const sorted = [...transactions].sort((a, b) => a.date - b.date);
  for (const t of sorted) {
    const price = priceAsOf(points, t.date);
    if (!price || price <= 0) continue;
    const cash = t.units * txTryPrice(t);
    if (t.side === "buy") {
      units += cash / price;
      invested += cash;
    } else {
      units -= cash / price;
      invested -= cash;
    }
  }
  const last = priceAsOf(points, now) ?? points[points.length - 1].price;
  const value = units * last;
  const returnPct = invested > 0 ? (value - invested) / invested : 0;
  return { value, invested, returnPct };
}

/** Mevduat: her nakit akışını yıllık faizle bugüne taşır. */
function depositBenchmark(
  transactions: Transaction[],
  annualRate: number,
  now: number,
): { value: number; invested: number; returnPct: number } {
  let fv = 0;
  let invested = 0;
  for (const t of transactions) {
    const cash = t.units * txTryPrice(t);
    const years = Math.max(0, (now - t.date) / (365 * DAY));
    const grown = cash * Math.pow(1 + annualRate, years);
    if (t.side === "buy") {
      fv += grown;
      invested += cash;
    } else {
      fv -= grown;
      invested -= cash;
    }
  }
  const returnPct = invested > 0 ? (fv - invested) / invested : 0;
  return { value: fv, invested, returnPct };
}

/** Tüm benchmark'leri hesaplar. */
export function computeBenchmarks(
  transactions: Transaction[],
  macro: MacroSnapshot[],
  now: number,
): BenchmarkResult[] {
  const buysSells = transactions.filter((t) => t.side === "buy" || t.side === "sell");
  const latestRate =
    [...macro].sort((a, b) => b.date - a.date)[0]?.depositRateAnnual ?? 0.4;

  const bist = applyFlowsToBenchmark(buysSells, macroSeries(macro, "bist100"), now);
  const gold = applyFlowsToBenchmark(buysSells, macroSeries(macro, "gramGold"), now);
  const usd = applyFlowsToBenchmark(buysSells, macroSeries(macro, "usdTry"), now);
  const dep = depositBenchmark(buysSells, latestRate, now);

  return [
    { key: "bist100", label: "BIST 100", returnPct: bist.returnPct, currentValue: bist.value, invested: bist.invested },
    { key: "gramGold", label: "Gram Altın", returnPct: gold.returnPct, currentValue: gold.value, invested: gold.invested },
    { key: "usd", label: "Dolar", returnPct: usd.returnPct, currentValue: usd.value, invested: usd.invested },
    { key: "deposit", label: "Mevduat", returnPct: dep.returnPct, currentValue: dep.value, invested: dep.invested },
  ];
}
