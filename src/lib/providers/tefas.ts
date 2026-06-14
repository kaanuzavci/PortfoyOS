// TEFAS fon fiyatı sağlayıcısı — BindHistoryInfo (ücretsiz, anahtarsız).
// Son ~15 günün kayıtlarını çekip en güncel FIYAT'ı döndürür. Hata → null.
import { fetchWithTimeout, type PriceProvider, type PriceQuery, type PriceResult } from "./types";

const TEFAS_URL = "https://www.tefas.gov.tr/api/DB/BindHistoryInfo";

function ddmmyyyy(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export interface TefasRow {
  TARIH: number | string;
  FONKODU: string;
  FIYAT: number;
}

/** Satırlardan en güncel (TARIH'i en büyük) geçerli fiyatı seçer. SAF. */
export function pickLatestFundPrice(rows: TefasRow[]): number | null {
  if (!rows || rows.length === 0) return null;
  const latest = rows.reduce((a, b) => (Number(a.TARIH) >= Number(b.TARIH) ? a : b));
  const price = Number(latest.FIYAT);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export async function fetchFundPrice(code: string): Promise<number | null> {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 15 * 86_400_000);
    const body = new URLSearchParams({
      fontip: "YAT",
      sfontur: "",
      fonkod: code.toUpperCase(),
      fongrup: "",
      bastarih: ddmmyyyy(start),
      bittarih: ddmmyyyy(now),
      fonturkod: "",
      fonunvantip: "",
    });
    const res = await fetchWithTimeout(
      TEFAS_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://www.tefas.gov.tr/TarihselVeriler.aspx",
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
        body: body.toString(),
      },
      10_000,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: TefasRow[] };
    return pickLatestFundPrice(json.data ?? []);
  } catch {
    return null;
  }
}

export const tefasProvider: PriceProvider = {
  supports: (q: PriceQuery) => q.type === "fon",
  async fetchPrice(q: PriceQuery): Promise<PriceResult> {
    return { price: await fetchFundPrice(q.ticker), source: "tefas" };
  },
};
