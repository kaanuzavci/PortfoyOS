// TCMB döviz kuru sağlayıcısı — today.xml (ücretsiz, anahtarsız). Satış kuru.
import { fetchWithTimeout, type PriceProvider, type PriceQuery, type PriceResult } from "./types";

const TCMB_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";

let cache: { at: number; xml: string } | null = null;

async function getXml(): Promise<string> {
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache.xml;
  const res = await fetchWithTimeout(TCMB_URL);
  if (!res.ok) throw new Error(`TCMB ${res.status}`);
  const xml = await res.text();
  cache = { at: Date.now(), xml };
  return xml;
}

/** today.xml içeriğinden bir döviz kodunun satış kurunu (birim başına) ayrıştırır. SAF. */
export function parseTcmbRate(xml: string, code: string): number | null {
  const block = new RegExp(
    `<Currency[^>]*Kod="${code}"[^>]*>([\\s\\S]*?)</Currency>`,
    "i",
  ).exec(xml);
  if (!block) return null;
  const sell = /<ForexSelling>([\d.]+)<\/ForexSelling>/i.exec(block[1]);
  const unit = /<Unit>(\d+)<\/Unit>/i.exec(block[1]);
  if (!sell) return null;
  const u = unit ? Number(unit[1]) : 1;
  const rate = Number(sell[1]) / (u || 1);
  return Number.isFinite(rate) ? rate : null;
}

/** Bir döviz kodunun TRY satış kuru (USD, EUR, …). */
export async function getRate(code: string): Promise<number | null> {
  try {
    const xml = await getXml();
    return parseTcmbRate(xml, code);
  } catch {
    return null;
  }
}

const CODE_BY_CURRENCY: Record<string, string> = { USD: "USD", EUR: "EUR" };

export const tcmbProvider: PriceProvider = {
  supports: (q: PriceQuery) =>
    q.type === "doviz" && (q.currency in CODE_BY_CURRENCY || q.ticker in CODE_BY_CURRENCY),
  async fetchPrice(q: PriceQuery): Promise<PriceResult> {
    const code = CODE_BY_CURRENCY[q.currency] ?? CODE_BY_CURRENCY[q.ticker] ?? "USD";
    const rate = await getRate(code);
    return { price: rate, source: "tcmb" };
  },
};
