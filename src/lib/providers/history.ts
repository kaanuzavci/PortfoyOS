// Geçmiş fiyat sağlayıcısı (yalnızca sunucu) — gerçek günlük fiyat geçmişi.
// Yahoo Finance chart API'sinden (hisse .IS, döviz =X, kripto -USD, altın GC=F).
// Rate-limit'e dayanıklı: hata/boşsa boş dizi döner; ASLA sahte veri üretmez.
import { fetchWithTimeout } from "./types";
import { bistSymbol, cryptoSymbol, gramGoldFromOunce } from "./yahoo";
import type { AssetType } from "@/types";

export interface HistoryPoint {
  date: number; // gün başı (epoch ms)
  price: number;
}

function dayStart(tsSec: number): number {
  const d = new Date(tsSec * 1000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Yahoo chart serisini gün → kapanış haritası olarak getirir. */
async function yahooSeries(
  symbol: string,
  range = "1y",
): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?interval=1d&range=${range}`;
    const res = await fetchWithTimeout(url, {}, 12_000);
    if (!res.ok) return map;
    const json = (await res.json()) as {
      chart?: {
        result?: {
          timestamp?: number[];
          indicators?: { quote?: { close?: (number | null)[] }[] };
        }[];
      };
    };
    const r = json.chart?.result?.[0];
    const ts = r?.timestamp ?? [];
    const cl = r?.indicators?.quote?.[0]?.close ?? [];
    for (let i = 0; i < ts.length; i++) {
      const c = cl[i];
      if (typeof c === "number" && Number.isFinite(c) && c > 0) {
        map.set(dayStart(ts[i]), c);
      }
    }
  } catch {
    /* boş döner */
  }
  return map;
}

/** Gün haritasından, verilen güne kadar (≤) en son değeri taşıyarak dizi üretir. */
function carryForward(
  days: number[],
  lookup: Map<number, number>,
): Map<number, number> {
  const sortedKeys = [...lookup.keys()].sort((a, b) => a - b);
  const out = new Map<number, number>();
  let ptr = 0;
  let last: number | null = null;
  for (const day of days) {
    while (ptr < sortedKeys.length && sortedKeys[ptr] <= day) {
      last = lookup.get(sortedKeys[ptr])!;
      ptr++;
    }
    if (last != null) out.set(day, last);
  }
  return out;
}

function toPoints(map: Map<number, number>): HistoryPoint[] {
  return [...map.entries()]
    .map(([date, price]) => ({ date, price: round2(price) }))
    .sort((a, b) => a.date - b.date);
}

export interface HistoryQuery {
  ticker: string;
  type: AssetType;
  currency: string;
}

export interface HistoryResult {
  points: HistoryPoint[];
  source: string;
}

/** Bir varlık için gerçek günlük fiyat geçmişi (TRY). */
export async function fetchHistory(
  q: HistoryQuery,
  range = "1y",
): Promise<HistoryResult> {
  if (q.type === "hisse") {
    const m = await yahooSeries(bistSymbol(q.ticker), range);
    return { points: toPoints(m), source: "yahoo" };
  }
  if (q.type === "doviz") {
    const code = (q.currency || q.ticker || "USD").toUpperCase();
    const sym = code === "USD" ? "USDTRY=X" : `${code}TRY=X`;
    const m = await yahooSeries(sym, range);
    return { points: toPoints(m), source: "yahoo" };
  }
  if (q.type === "kripto") {
    const usd = await yahooSeries(cryptoSymbol(q.ticker), range);
    const usdtry = await yahooSeries("USDTRY=X", range);
    const days = [...usd.keys()].sort((a, b) => a - b);
    const fx = carryForward(days, usdtry);
    const out = new Map<number, number>();
    for (const d of days) {
      const r = fx.get(d);
      if (r != null) out.set(d, usd.get(d)! * r);
    }
    return { points: toPoints(out), source: "yahoo" };
  }
  if (q.type === "altin") {
    const ounce = await yahooSeries("GC=F", range);
    const usdtry = await yahooSeries("USDTRY=X", range);
    const days = [...ounce.keys()].sort((a, b) => a - b);
    const fx = carryForward(days, usdtry);
    const out = new Map<number, number>();
    for (const d of days) {
      const r = fx.get(d);
      if (r != null) out.set(d, gramGoldFromOunce(ounce.get(d)!, r));
    }
    return { points: toPoints(out), source: "yahoo~" };
  }
  // fon (TEFAS kapalı) ve diğerleri: geçmiş yok
  return { points: [], source: "yok" };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
