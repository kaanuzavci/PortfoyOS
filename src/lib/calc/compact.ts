// Fiyat geçmişi sıkıştırma — tek-doküman Firestore modelinde 1 MB sınırına
// takılmamak için. Son ~13 ay GÜNLÜK, ~3 yıla kadar HAFTALIK, ötesi AYLIK tutulur
// (her kovada en güncel snapshot). SAF + deterministik (idempotent).
import type { PriceSnapshot } from "@/types";

const DAY = 86_400_000;

export interface CompactOptions {
  dailyDays?: number; // bu güne kadar günlük tut
  weeklyYears?: number; // bu yıla kadar haftalık tut, ötesi aylık
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function ym(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

function isoWeek(d: Date): string {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (date.getDay() + 6) % 7; // Pazartesi=0
  date.setDate(date.getDate() - day + 3); // o haftanın perşembesi
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      (date.getTime() - firstThursday.getTime()) / (7 * DAY) -
        ((firstThursday.getDay() + 6) % 7) / 7,
    );
  return `${date.getFullYear()}-W${week}`;
}

function bucketKey(date: number, now: number, dailyDays: number, weeklyYears: number): string {
  const age = now - date;
  const d = new Date(date);
  if (age < dailyDays * DAY) return `d:${ymd(d)}`;
  if (age < weeklyYears * 365 * DAY) return `w:${isoWeek(d)}`;
  return `m:${ym(d)}`;
}

/**
 * Fiyat snapshot'larını kademeli olarak sıkıştırır: her varlık + zaman kovasında
 * en güncel kayıt tutulur. Sonuç tarih+varlık bazında sıralı.
 */
export function compactSnapshots(
  snapshots: PriceSnapshot[],
  now: number = Date.now(),
  opts: CompactOptions = {},
): PriceSnapshot[] {
  const dailyDays = opts.dailyDays ?? 400;
  const weeklyYears = opts.weeklyYears ?? 3;

  // assetId + kova → en güncel snapshot
  const kept = new Map<string, PriceSnapshot>();
  for (const s of [...snapshots].sort((a, b) => a.date - b.date)) {
    const key = `${s.assetId}|${bucketKey(s.date, now, dailyDays, weeklyYears)}`;
    const existing = kept.get(key);
    if (!existing || s.date >= existing.date) kept.set(key, s);
  }
  return [...kept.values()].sort(
    (a, b) => a.date - b.date || a.assetId.localeCompare(b.assetId),
  );
}
