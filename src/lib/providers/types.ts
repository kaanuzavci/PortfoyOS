// Fiyat sağlayıcı arayüzü (doküman 9.8). Sağlayıcılar YALNIZCA sunucuda
// (Next.js Route Handler) çalışır — CORS'u aşmak ve gizli anahtarları client'a
// sızdırmamak için. Hata verirse null döner; çağıran o varlığı atlar.
import type { AssetType } from "@/types";

export interface PriceQuery {
  ticker: string;
  type: AssetType;
  currency: string;
}

export interface PriceResult {
  price: number | null;
  source: string;
}

export interface PriceProvider {
  /** Bu sağlayıcının desteklediği varlık türleri. */
  supports: (q: PriceQuery) => boolean;
  /** TRY cinsinden güncel birim fiyatı döndürür (yoksa null). */
  fetchPrice: (q: PriceQuery) => Promise<PriceResult>;
}

/** Yardımcı: zaman aşımlı fetch (kırılgan dış uçlar için). */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (PortfoyOS price fetcher)",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}
