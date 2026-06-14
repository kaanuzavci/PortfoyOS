// Bulut senkron katmanı — kullanıcının tüm portföyü tek bir Firestore
// dokümanında: users/{uid}/data/portfolio. Gerçek zamanlı (onSnapshot) okuma +
// (debounce'lu) tam-doküman yazma. Çok cihaz senkronu sağlar.
import { db } from "./config";
import type { PortfolioData } from "@/types";

const COLLECTION_KEYS: (keyof PortfolioData)[] = [
  "assets",
  "transactions",
  "priceSnapshots",
  "macroSnapshots",
  "alerts",
  "alertRules",
  "goals",
  "ipos",
];

/** Yalnızca portföy koleksiyonlarını içeren, undefined'sız temiz nesne. */
export function cleanPortfolio(data: PortfolioData): PortfolioData {
  const picked: Partial<PortfolioData> = {};
  for (const k of COLLECTION_KEYS) {
    // JSON round-trip: undefined alanları temizler (Firestore uyumu).
    picked[k] = JSON.parse(JSON.stringify(data[k] ?? [])) as never;
  }
  return picked as PortfolioData;
}

/** Senkron için kararlı imza (echo/döngü önleme). */
export function portfolioSignature(data: PortfolioData): string {
  return JSON.stringify(cleanPortfolio(data));
}

/** Kullanıcının portföy dokümanını gerçek zamanlı dinler. */
export async function subscribePortfolio(
  uid: string,
  onData: (data: PortfolioData | null) => void,
  onError?: (e: unknown) => void,
): Promise<() => void> {
  if (!db) return () => {};
  const { doc, onSnapshot } = await import("firebase/firestore");
  const ref = doc(db, "users", uid, "data", "portfolio");
  return onSnapshot(
    ref,
    (snap) => onData(snap.exists() ? (snap.data() as PortfolioData) : null),
    (err) => onError?.(err),
  );
}

/** Portföyü buluta yazar (tam doküman). */
export async function savePortfolio(uid: string, data: PortfolioData): Promise<void> {
  if (!db) return;
  const { doc, setDoc } = await import("firebase/firestore");
  const ref = doc(db, "users", uid, "data", "portfolio");
  await setDoc(ref, cleanPortfolio(data) as unknown as Record<string, unknown>);
}
