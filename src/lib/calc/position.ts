// Pozisyon & maliyet hesabı — ağırlıklı ortalama maliyet (weighted-average).
// SAF fonksiyonlar: yalnızca işlemler + fiyatlardan türetir. UI'dan bağımsız, testli.
import type { Transaction, PriceSnapshot } from "@/types";

export interface PositionResult {
  assetId: string;
  heldUnits: number;
  /** TRY cinsinden birim başına ağırlıklı ortalama maliyet */
  avgCost: number;
  /** Elde tutulan adetlerin TRY maliyeti */
  costBasis: number;
  /** Birim başına son fiyat (TRY) */
  latestPrice: number;
  latestPriceDate: number | null;
  /** Güncel değer (TRY) */
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  realizedPnl: number;
  totalPnl: number;
  totalReturnPct: number;
  /** Tüm zamanlar boyunca yatırılan toplam (alış maliyeti + masraflar) */
  totalInvested: number;
}

/** Bir işlemin TRY cinsinden birim fiyatı (TRY dışıysa fxRate ile dönüştürülür). */
export function txTryPrice(t: Transaction): number {
  return t.pricePerUnit * (t.fxRate ?? 1);
}

/** Bir snapshot'ın TRY cinsinden fiyatı. */
export function snapTryPrice(p: PriceSnapshot): number {
  return p.price * (p.fxRateToTRY ?? 1);
}

/** Bir varlık için en güncel fiyat snapshot'ı (TRY). */
export function latestPriceOf(
  assetId: string,
  snapshots: PriceSnapshot[],
  asOf?: number,
): { price: number; date: number } | null {
  let best: PriceSnapshot | null = null;
  for (const s of snapshots) {
    if (s.assetId !== assetId) continue;
    if (asOf != null && s.date > asOf) continue;
    if (!best || s.date > best.date) best = s;
  }
  return best ? { price: snapTryPrice(best), date: best.date } : null;
}

/**
 * Bir varlığın pozisyonunu işlemlerden ve son fiyattan hesaplar.
 * Ağırlıklı ortalama maliyet yöntemi; alış masrafı maliyete eklenir,
 * satış masrafı hasılattan düşülür.
 */
export function computePosition(
  assetId: string,
  transactions: Transaction[],
  snapshots: PriceSnapshot[],
  asOf?: number,
): PositionResult {
  const txs = transactions
    .filter((t) => t.assetId === assetId && (asOf == null || t.date <= asOf))
    .sort((a, b) => a.date - b.date || a.createdAt - b.createdAt);

  let runningUnits = 0;
  let runningCost = 0; // elde tutulan adetlerin toplam TRY maliyeti
  let realizedPnl = 0;
  let totalInvested = 0;

  for (const t of txs) {
    const price = txTryPrice(t);
    const fee = t.fee ?? 0;
    if (t.side === "buy") {
      runningCost += t.units * price + fee;
      runningUnits += t.units;
      totalInvested += t.units * price + fee;
    } else {
      const avg = runningUnits > 0 ? runningCost / runningUnits : 0;
      const soldUnits = Math.min(t.units, runningUnits);
      const costRemoved = avg * soldUnits;
      realizedPnl += soldUnits * price - fee - costRemoved;
      runningCost -= costRemoved;
      runningUnits -= soldUnits;
    }
  }

  const heldUnits = round(runningUnits);
  const avgCost = runningUnits > 0 ? runningCost / runningUnits : 0;
  const costBasis = runningCost;

  const latest = latestPriceOf(assetId, snapshots, asOf);
  const latestPrice = latest?.price ?? avgCost;
  const currentValue = latestPrice * runningUnits;
  const unrealizedPnl = (latestPrice - avgCost) * runningUnits;
  const unrealizedPnlPct = costBasis > 0 ? unrealizedPnl / costBasis : 0;
  const totalPnl = realizedPnl + unrealizedPnl;
  const totalReturnPct = totalInvested > 0 ? totalPnl / totalInvested : 0;

  return {
    assetId,
    heldUnits,
    avgCost,
    costBasis,
    latestPrice,
    latestPriceDate: latest?.date ?? null,
    currentValue,
    unrealizedPnl,
    unrealizedPnlPct,
    realizedPnl,
    totalPnl,
    totalReturnPct,
    totalInvested,
  };
}

function round(n: number, dp = 8): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
