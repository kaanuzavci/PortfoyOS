// truncgil finans sağlayıcısı — Türkiye serbest piyasa gram altın (ücretsiz,
// anahtarsız). Banka/kapalıçarşıya uluslararası spottan çok daha yakın.
import { fetchWithTimeout, type PriceProvider, type PriceQuery, type PriceResult } from "./types";

const URL_V4 = "https://finans.truncgil.com/v4/today.json";

let cache: { at: number; json: Record<string, { Buying?: number; Selling?: number }> } | null = null;

async function getJson() {
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache.json;
  const res = await fetchWithTimeout(URL_V4);
  if (!res.ok) throw new Error(`truncgil ${res.status}`);
  const json = (await res.json()) as Record<string, { Buying?: number; Selling?: number }>;
  cache = { at: Date.now(), json };
  return json;
}

/** TR serbest piyasa gram altın fiyatı (₺). */
export async function getGramGold(): Promise<number | null> {
  try {
    const j = await getJson();
    const gra = j["GRA"]; // GRAMALTIN
    const p = Number(gra?.Selling ?? gra?.Buying);
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch {
    return null;
  }
}

export const truncgilGoldProvider: PriceProvider = {
  supports: (q: PriceQuery) => q.type === "altin",
  async fetchPrice(): Promise<PriceResult> {
    return { price: await getGramGold(), source: "truncgil" };
  },
};
