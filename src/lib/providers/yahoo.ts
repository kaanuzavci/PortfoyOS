// Yahoo Finance sağlayıcısı — hisse (BIST .IS), kripto, altın (best-effort).
// Ücretsiz/anahtarsız; resmi olmayan uç, değişebilir. Hata → null.
import { fetchWithTimeout, type PriceProvider, type PriceQuery, type PriceResult } from "./types";
import { getRate } from "./tcmb";

const GRAMS_PER_OUNCE = 31.1035;

/** BIST sembolü: "ASELS" → "ASELS.IS" (zaten nokta içeriyorsa dokunma). SAF. */
export function bistSymbol(ticker: string): string {
  return ticker.includes(".") ? ticker : `${ticker}.IS`;
}

/** Kripto sembolü: "BTC" → "BTC-USD". SAF. */
export function cryptoSymbol(ticker: string): string {
  return ticker.includes("-") ? ticker : `${ticker}-USD`;
}

/** Ons/USD altın fiyatından gram ₺ hesabı. SAF. */
export function gramGoldFromOunce(ounceUsd: number, usdTry: number): number {
  return (ounceUsd / GRAMS_PER_OUNCE) * usdTry;
}

async function yahooPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?interval=1d&range=1d`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: { result?: { meta?: { regularMarketPrice?: number } }[] };
    };
    const price = json.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === "number" && Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

export const yahooProvider: PriceProvider = {
  supports: (q: PriceQuery) =>
    q.type === "hisse" || q.type === "kripto" || q.type === "altin",
  async fetchPrice(q: PriceQuery): Promise<PriceResult> {
    if (q.type === "hisse") {
      return { price: await yahooPrice(bistSymbol(q.ticker)), source: "yahoo" };
    }
    if (q.type === "kripto") {
      const usd = await yahooPrice(cryptoSymbol(q.ticker));
      const usdTry = await getRate("USD");
      const price = usd != null && usdTry != null ? usd * usdTry : null;
      return { price, source: "yahoo" };
    }
    // altın: ons/USD (GC=F) → gram ₺
    const ounceUsd = await yahooPrice("GC=F");
    const usdTry = await getRate("USD");
    const price =
      ounceUsd != null && usdTry != null
        ? gramGoldFromOunce(ounceUsd, usdTry)
        : null;
    return { price, source: "yahoo" };
  },
};
