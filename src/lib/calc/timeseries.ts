// Zaman serisi & dönemsel getiri — portföy değerinin günlük serisi ve
// G/H/A/Y/Tüm dönem getirileri. SAF.
import type { Asset, Transaction, PriceSnapshot } from "@/types";
import { snapTryPrice, txTryPrice } from "./position";

const DAY = 86_400_000;

export type Period = "1G" | "1H" | "1A" | "1Y" | "TUM";

export const PERIOD_LABELS: Record<Period, string> = {
  "1G": "Gün",
  "1H": "Hafta",
  "1A": "Ay",
  "1Y": "Yıl",
  TUM: "Tüm",
};

export const PERIODS: Period[] = ["1G", "1H", "1A", "1Y", "TUM"];

export interface ValuePoint {
  date: number;
  value: number; // güncel TRY değeri
  costBasis: number; // o gün elde tutulanların maliyeti
  invested: number; // kümülatif net yatırılan (alış - satış nakit)
  pnl: number; // value - costBasis (gerçekleşmemiş)
}

interface AssetSeries {
  snaps: { date: number; price: number }[]; // artan tarih
  txs: Transaction[]; // artan tarih
}

function buildAssetSeries(
  assets: Asset[],
  transactions: Transaction[],
  snapshots: PriceSnapshot[],
): Map<string, AssetSeries> {
  const map = new Map<string, AssetSeries>();
  for (const a of assets) {
    map.set(a.id, {
      snaps: snapshots
        .filter((s) => s.assetId === a.id)
        .map((s) => ({ date: s.date, price: snapTryPrice(s) }))
        .sort((x, y) => x.date - y.date),
      txs: transactions
        .filter((t) => t.assetId === a.id)
        .sort((x, y) => x.date - y.date || x.createdAt - y.createdAt),
    });
  }
  return map;
}

/** date <= hedef olan en son fiyat (yoksa null). */
function priceAsOf(snaps: { date: number; price: number }[], date: number): number | null {
  let lo = 0;
  let hi = snaps.length - 1;
  let res: number | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (snaps[mid].date <= date) {
      res = snaps[mid].price;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return res;
}

/** O tarihe kadar elde tutulan adet ve maliyet (ağırlıklı ortalama). */
function holdingAsOf(txs: Transaction[], date: number): { units: number; cost: number; netCash: number } {
  let units = 0;
  let cost = 0;
  let netCash = 0;
  for (const t of txs) {
    if (t.date > date) break;
    const price = txTryPrice(t);
    const fee = t.fee ?? 0;
    if (t.side === "buy") {
      cost += t.units * price + fee;
      units += t.units;
      netCash += t.units * price + fee;
    } else {
      const avg = units > 0 ? cost / units : 0;
      const sold = Math.min(t.units, units);
      cost -= avg * sold;
      units -= sold;
      netCash -= sold * price - fee;
    }
  }
  return { units, cost, netCash };
}

/**
 * Portföyün günlük değer serisini üretir. Tarih ekseni tüm snapshot ve işlem
 * tarihlerinin birleşimidir.
 */
export function portfolioValueSeries(
  assets: Asset[],
  transactions: Transaction[],
  snapshots: PriceSnapshot[],
): ValuePoint[] {
  if (assets.length === 0) return [];
  const series = buildAssetSeries(assets, transactions, snapshots);

  // Eksen ham tarihlerden kurulur; snapshot ve işlem tarihleriyle birebir
  // tutarlı kalsın diye startOfDay normalizasyonu uygulanmaz (tz kayması olmaz).
  const dateSet = new Set<number>();
  for (const s of snapshots) dateSet.add(s.date);
  for (const t of transactions) dateSet.add(t.date);
  const dates = [...dateSet].sort((a, b) => a - b);

  const points: ValuePoint[] = [];
  for (const date of dates) {
    let value = 0;
    let costBasis = 0;
    let invested = 0;
    for (const a of assets) {
      const as = series.get(a.id)!;
      const hold = holdingAsOf(as.txs, date);
      if (hold.units <= 0 && hold.netCash === 0) continue;
      const price = priceAsOf(as.snaps, date);
      if (price != null) value += hold.units * price;
      costBasis += hold.cost;
      invested += hold.netCash;
    }
    points.push({
      date,
      value: round2(value),
      costBasis: round2(costBasis),
      invested: round2(invested),
      pnl: round2(value - costBasis),
    });
  }
  return points;
}

/** Dönem başlangıç tarihini verir (now'a göre). */
export function periodStart(period: Period, now: number, series?: ValuePoint[]): number {
  switch (period) {
    case "1G":
      return now - 1 * DAY;
    case "1H":
      return now - 7 * DAY;
    case "1A":
      return now - 30 * DAY;
    case "1Y":
      return now - 365 * DAY;
    case "TUM":
      return series && series.length ? series[0].date : 0;
  }
}

export interface PeriodReturn {
  startValue: number;
  endValue: number;
  netFlow: number; // dönem içi net yatırılan
  gain: number; // endValue - startValue - netFlow
  pct: number; // gain / max(startValue, netFlow)
}

/** Bir döneme ait para-ağırlıklı getiri (dönem içi net yatırım düzeltmeli). */
export function periodReturn(
  series: ValuePoint[],
  transactions: Transaction[],
  start: number,
  now: number,
): PeriodReturn {
  if (series.length === 0) {
    return { startValue: 0, endValue: 0, netFlow: 0, gain: 0, pct: 0 };
  }
  const startValue = valueAt(series, start);
  const endValue = series[series.length - 1].value;

  let netFlow = 0;
  for (const t of transactions) {
    if (t.date <= start || t.date > now) continue;
    const cash = t.units * txTryPrice(t) + (t.side === "buy" ? (t.fee ?? 0) : -(t.fee ?? 0));
    netFlow += t.side === "buy" ? cash : -cash;
  }

  const gain = endValue - startValue - netFlow;
  const base = Math.max(startValue, startValue + netFlow, Math.abs(netFlow), 1);
  return {
    startValue: round2(startValue),
    endValue: round2(endValue),
    netFlow: round2(netFlow),
    gain: round2(gain),
    pct: gain / base,
  };
}

/** Seride verilen tarihteki (<=) portföy değeri. */
export function valueAt(series: ValuePoint[], date: number): number {
  let res = 0;
  for (const p of series) {
    if (p.date <= date) res = p.value;
    else break;
  }
  // İstenen tarih ilk noktadan önceyse ilk değeri kullan
  if (date < series[0].date) return series[0].value;
  return res;
}

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
