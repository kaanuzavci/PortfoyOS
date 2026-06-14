// Sağlayıcı kayıt defteri ve çözümleyici. Yalnızca sunucuda kullanılır.
import type { PriceProvider, PriceQuery, PriceResult } from "./types";
import { tefasProvider } from "./tefas";
import { yahooProvider } from "./yahoo";
import { tcmbProvider } from "./tcmb";

const PROVIDERS: PriceProvider[] = [tefasProvider, yahooProvider, tcmbProvider];

/** Varlık türüne uygun ilk sağlayıcıyı bulup fiyatı döndürür. */
export async function resolvePrice(q: PriceQuery): Promise<PriceResult> {
  const provider = PROVIDERS.find((p) => p.supports(q));
  if (!provider) return { price: null, source: "yok" };
  try {
    return await provider.fetchPrice(q);
  } catch {
    return { price: null, source: provider === tefasProvider ? "tefas" : "hata" };
  }
}

export type { PriceQuery, PriceResult };
