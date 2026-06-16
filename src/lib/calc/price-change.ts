// Dönemsel fiyat değişimi — bir varlığın N gün önceki fiyatına göre % değişimi.
// "Son 7 günde en çok artanlar" widget'ı için. SAF.
import type { PriceSnapshot } from "@/types";

const DAY = 86_400_000;

export interface PriceChange {
  current: number;
  past: number;
  changePct: number; // kesir (0.05 = %5)
  hasData: boolean;
}

/** Bir varlığın `days` gün önceki fiyatına göre değişimi. */
export function priceChangePct(
  snapshots: PriceSnapshot[],
  assetId: string,
  days = 7,
  now: number = Date.now(),
): PriceChange {
  const snaps = snapshots
    .filter((s) => s.assetId === assetId)
    .map((s) => ({ date: s.date, price: s.price * (s.fxRateToTRY ?? 1) }))
    .sort((a, b) => a.date - b.date);

  if (snaps.length === 0) {
    return { current: 0, past: 0, changePct: 0, hasData: false };
  }
  const current = snaps[snaps.length - 1].price;
  const target = now - days * DAY;

  // Hedefe en yakın (≤) geçmiş fiyat; yoksa en eski.
  let past = snaps[0].price;
  let found = false;
  for (const s of snaps) {
    if (s.date <= target) {
      past = s.price;
      found = true;
    } else break;
  }
  // Geçmiş veri hedeften çok daha yeniyse (ör. yalnız bugünün fiyatı) anlamlı değil.
  const oldestDate = snaps[0].date;
  const hasData = found || oldestDate <= target;

  const changePct = past > 0 ? (current - past) / past : 0;
  return { current, past, changePct, hasData };
}
