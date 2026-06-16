// PortföyOS — Ortak veri tipleri (Firestore modelleriyle uyumlu)
// Tarihler uygulama katmanında epoch milisaniye (number) olarak tutulur;
// Firestore Timestamp'e dönüşüm repository sınırında yapılır.

export type AssetType =
  | "fon"
  | "hisse"
  | "halka_arz"
  | "altin"
  | "doviz"
  | "mevduat"
  | "kripto"
  | "diger";

export type Currency = "TRY" | "USD" | "EUR" | "XAU";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  fon: "Fon",
  hisse: "Hisse",
  halka_arz: "Halka Arz",
  altin: "Altın",
  doviz: "Döviz",
  mevduat: "Mevduat",
  kripto: "Kripto",
  diger: "Diğer",
};

export interface Asset {
  id: string;
  name: string;
  ticker?: string;
  type: AssetType;
  currency: Currency;
  sector?: string;
  tags?: string[];
  priceSource?: string; // "manuel" | "tefas" | "yahoo" | "truncgil" | "banka" ...
  /**
   * Fiyat güncelleme modu:
   * - "auto" (varsayılan): otomatik çekilen piyasa fiyatı aynen kullanılır.
   * - "spread": piyasa × (1 + spreadPct) — banka makası uygulanır (kalibre edilir).
   * - "manual": otomatik güncelleme bu varlığa dokunmaz; fiyat hep elle girilir.
   */
  priceMode?: "auto" | "spread" | "manual";
  /** Banka makası (kesir). Ör. 0.018 = piyasanın %1,8 üzeri. "spread" modunda kullanılır. */
  spreadPct?: number;
  targetPrice?: number;
  stopLossPrice?: number;
  note?: string; // "neden aldım"
  /** İzleme listesi öğesi mi? (henüz almadığın, takip ettiğin varlık) */
  isWatchlist?: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  assetId: string;
  side: "buy" | "sell";
  date: number;
  units: number;
  pricePerUnit: number;
  fee?: number;
  fxRate?: number; // TRY dışıysa o günkü kur
  note?: string;
  createdAt: number;
}

export interface PriceSnapshot {
  id: string;
  assetId: string;
  date: number;
  price: number;
  fxRateToTRY?: number;
  source: string;
}

export interface MacroSnapshot {
  id: string;
  date: number;
  cpiIndex: number; // TÜFE endeksi
  bist100: number;
  gramGold: number;
  usdTry: number;
  depositRateAnnual: number; // yıllık mevduat faizi (ör. 0.45)
}

export type AlertType =
  | "streak_up"
  | "streak_down"
  | "streak_broken"
  | "target_hit"
  | "stoploss_hit"
  | "daily_move"
  | "real_return_flip"
  | "ipo_new"
  | "milestone"
  | "rebalance";

export type AlertSeverity = "info" | "success" | "warning" | "danger";

export interface Alert {
  id: string;
  type: AlertType;
  assetId?: string;
  level?: number;
  title: string;
  body: string;
  severity: AlertSeverity;
  isRead: boolean;
  createdAt: number;
}

export type AlertChannel = "inapp" | "push" | "email";

export interface AlertRule {
  id: string;
  enabled: boolean;
  type: AlertType;
  assetId?: string;
  threshold?: number;
  channels: AlertChannel[];
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  targetDate?: number;
  createdAt: number;
}

export interface IpoEntry {
  id: string;
  name: string;
  ticker: string;
  price?: number;
  demandDate?: number; // talep tarihi
  lot?: number;
  publicFloatPct?: number; // halka açıklık %
  participationEligible?: boolean; // katılım endeksi uygunluğu
  note?: string;
  createdAt: number;
}

/** Tüm portföy koleksiyonları — tek doğruluk kaynağı (store + hesaplama girdisi). */
export interface PortfolioData {
  assets: Asset[];
  transactions: Transaction[];
  priceSnapshots: PriceSnapshot[];
  macroSnapshots: MacroSnapshot[];
  alerts: Alert[];
  alertRules: AlertRule[];
  goals: Goal[];
  ipos: IpoEntry[];
}
