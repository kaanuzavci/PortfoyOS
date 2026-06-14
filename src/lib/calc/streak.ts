// Seri tespiti — ardışık günlük artış (kâr) / azalış (zarar). Yön değişince sıfırlanır.
// Seviyeler config'ten ayarlanabilir (varsayılanlar Bölüm 9.5). SAF.

export type StreakDirection = "up" | "down" | "none";

export interface StreakLevel {
  level: number;
  name: string;
  days: number;
}

export const PROFIT_LEVELS: StreakLevel[] = [
  { level: 1, name: "Kıvılcım", days: 3 },
  { level: 2, name: "Momentum", days: 5 },
  { level: 3, name: "Ateş", days: 8 },
  { level: 4, name: "Roket", days: 12 },
  { level: 5, name: "Zirve", days: 20 },
];

export const LOSS_LEVELS: StreakLevel[] = [
  { level: 1, name: "Dikkat", days: 3 },
  { level: 2, name: "Uyarı", days: 5 },
  { level: 3, name: "Tehlike", days: 8 },
  { level: 4, name: "Kritik", days: 12 },
];

export interface StreakResult {
  direction: StreakDirection;
  length: number;
  level: StreakLevel | null;
  nextLevel: StreakLevel | null;
}

/**
 * Değer serisinden (artan tarih) baştan-sona yürüyerek serinin yönünü ve
 * uzunluğunu tespit eder. Son noktadan geriye doğru sayar.
 */
export function detectStreak(values: number[]): StreakResult {
  if (values.length < 2) {
    return { direction: "none", length: 0, level: null, nextLevel: null };
  }
  // Son adımın yönü
  const lastDiff = values[values.length - 1] - values[values.length - 2];
  const dir: StreakDirection = lastDiff > 0 ? "up" : lastDiff < 0 ? "down" : "none";
  if (dir === "none") {
    return { direction: "none", length: 0, level: null, nextLevel: null };
  }

  let length = 0;
  for (let i = values.length - 1; i > 0; i--) {
    const diff = values[i] - values[i - 1];
    const d: StreakDirection = diff > 0 ? "up" : diff < 0 ? "down" : "none";
    if (d === dir) length++;
    else break;
  }

  const levels = dir === "up" ? PROFIT_LEVELS : LOSS_LEVELS;
  const level = levelForLength(length, levels);
  const nextLevel =
    levels.find((l) => l.days > length) ?? null;

  return { direction: dir, length, level, nextLevel };
}

export function levelForLength(
  length: number,
  levels: StreakLevel[],
): StreakLevel | null {
  let res: StreakLevel | null = null;
  for (const l of levels) {
    if (length >= l.days) res = l;
  }
  return res;
}
