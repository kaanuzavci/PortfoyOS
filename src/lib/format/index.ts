// Türkçe (tr-TR) para, sayı, yüzde ve tarih biçimleyicileri.
// Para: ₺1.234,56 · Yüzde: %12,3 · Tarih: dd.MM.yyyy
import { format as dfFormat, formatDistanceToNowStrict } from "date-fns";
import { tr } from "date-fns/locale";

const tryCurrency = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const tryCurrencyCompact = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  notation: "compact",
  maximumFractionDigits: 1,
});

const decimal = new Intl.NumberFormat("tr-TR", {
  maximumFractionDigits: 2,
});

/** ₺1.234,56 */
export function formatTRY(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "₺0,00";
  return tryCurrency.format(n);
}

/** Büyük tutarlar için sıkıştırılmış: ₺1,2 Mn */
export function formatTRYCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "₺0";
  return tryCurrencyCompact.format(n);
}

/** İşaretli para: +₺1.234,56 / −₺1.234,56 (gerçek eksi işareti) */
export function formatSignedTRY(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "₺0,00";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${tryCurrency.format(Math.abs(n))}`;
}

/** Serbest sayı, ondalık kontrolü ile */
export function formatNumber(
  n: number | null | undefined,
  maxFractionDigits = 2,
): string {
  if (n == null || !Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: maxFractionDigits,
  }).format(n);
}

export { decimal as decimalFormatter };

/**
 * Oranı yüzdeye çevirir. ratio=0.123 → "%12,3"
 * @param ratio kesir (0.123 = %12,3)
 */
export function formatPercent(
  ratio: number | null | undefined,
  fractionDigits = 1,
): string {
  if (ratio == null || !Number.isFinite(ratio)) return "%0,0";
  const pct = ratio * 100;
  return `%${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(pct)}`;
}

/** İşaretli yüzde: +%12,3 / −%4,5 */
export function formatSignedPercent(
  ratio: number | null | undefined,
  fractionDigits = 1,
): string {
  if (ratio == null || !Number.isFinite(ratio)) return "%0,0";
  const sign = ratio > 0 ? "+" : ratio < 0 ? "−" : "";
  const pct = Math.abs(ratio) * 100;
  return `${sign}%${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(pct)}`;
}

/** dd.MM.yyyy */
export function formatDate(d: number | Date | null | undefined): string {
  if (d == null) return "—";
  return dfFormat(new Date(d), "dd.MM.yyyy", { locale: tr });
}

/** dd.MM.yyyy HH:mm */
export function formatDateTime(d: number | Date | null | undefined): string {
  if (d == null) return "—";
  return dfFormat(new Date(d), "dd.MM.yyyy HH:mm", { locale: tr });
}

/** "3 gün önce" gibi göreli süre */
export function formatRelative(d: number | Date | null | undefined): string {
  if (d == null) return "—";
  return formatDistanceToNowStrict(new Date(d), { locale: tr, addSuffix: true });
}

/** Para birimi sembolü */
export function currencySymbol(currency: string): string {
  switch (currency) {
    case "TRY":
      return "₺";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "XAU":
      return "gr";
    default:
      return "";
  }
}
