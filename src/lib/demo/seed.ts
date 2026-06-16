// Demo veri üreteci — gerçekçi bir Türk portföyü (fon, hisse, altın, dolar).
// 120 günlük günlük fiyat serisi + işlemler + aylık makro veriler. Tohumlu PRNG
// ile yeniden üretilebilir. Yalnızca ham veri üretir; K/Z lib/calc ile hesaplanır.
import type {
  Asset,
  Transaction,
  PriceSnapshot,
  MacroSnapshot,
  Goal,
  IpoEntry,
  PortfolioData,
} from "@/types";

const DAY = 86_400_000;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface AssetSpec {
  id: string;
  name: string;
  ticker: string;
  type: Asset["type"];
  sector?: string;
  start: number; // şekil için göreli başlangıç (seri sona göre ölçeklenir)
  current: number; // bugünkü gerçekçi fiyat (seri buraya çıpalanır — sıçrama olmasın)
  driftDaily: number; // günlük ortalama getiri
  vol: number; // günlük oynaklık
  units: number; // ilk alış adedi
  buyDayAgo: number; // kaç gün önce alındı
  target?: number;
  stop?: number;
  note?: string;
  extraBuy?: { dayAgo: number; units: number };
  sell?: { dayAgo: number; units: number };
}

const specs: AssetSpec[] = [
  {
    id: "a-akport",
    name: "Ak Portföy Yeni Teknolojiler Fonu",
    ticker: "AFT",
    type: "fon",
    sector: "Teknoloji",
    start: 24.5,
    current: 31.2,
    driftDaily: 0.0022,
    vol: 0.011,
    units: 1200,
    buyDayAgo: 118,
    extraBuy: { dayAgo: 60, units: 800 },
    note: "Teknoloji ağırlıklı uzun vadeli birikim.",
  },
  {
    id: "a-aselsan",
    name: "Aselsan",
    ticker: "ASELS",
    type: "hisse",
    sector: "Savunma",
    start: 48,
    current: 371,
    driftDaily: 0.0028,
    vol: 0.017,
    units: 400,
    buyDayAgo: 110,
    target: 78,
    stop: 42,
    note: "Savunma sanayi büyüme hikayesi.",
  },
  {
    id: "a-tupras",
    name: "Tüpraş",
    ticker: "TUPRS",
    type: "hisse",
    sector: "Enerji",
    start: 165,
    current: 176,
    driftDaily: 0.0011,
    vol: 0.015,
    units: 120,
    buyDayAgo: 95,
    target: 210,
    note: "Temettü + enerji.",
  },
  {
    id: "a-altin",
    name: "Gram Altın",
    ticker: "XAU",
    type: "altin",
    sector: "Değerli Metal",
    start: 2380,
    current: 6280,
    driftDaily: 0.0016,
    vol: 0.008,
    units: 30,
    buyDayAgo: 120,
    note: "Enflasyona karşı koruma.",
  },
  {
    id: "a-dolar",
    name: "Dolar (USD)",
    ticker: "USD",
    type: "doviz",
    sector: "Döviz",
    start: 31.8,
    current: 46.2,
    driftDaily: 0.0009,
    vol: 0.004,
    units: 2500,
    buyDayAgo: 100,
    note: "Kur sepeti.",
  },
  {
    id: "a-xyz",
    name: "Mavi Giyim",
    ticker: "MAVI",
    type: "hisse",
    sector: "Perakende",
    start: 92,
    current: 95,
    driftDaily: -0.0014,
    vol: 0.02,
    units: 150,
    buyDayAgo: 80,
    stop: 70,
    note: "Kısa vadeli denemeydi; zayıf gidiyor.",
    sell: { dayAgo: 20, units: 50 },
  },
];

export function generateSeed(now = Date.now()): PortfolioData {
  const today = startOfDay(now);
  const rand = mulberry32(20260614);
  const horizon = 120;

  const assets: Asset[] = [];
  const transactions: Transaction[] = [];
  const priceSnapshots: PriceSnapshot[] = [];

  for (const spec of specs) {
    const createdAt = today - spec.buyDayAgo * DAY;
    assets.push({
      id: spec.id,
      name: spec.name,
      ticker: spec.ticker,
      type: spec.type,
      currency: "TRY",
      sector: spec.sector,
      priceSource: "manuel",
      targetPrice: spec.target,
      stopLossPrice: spec.stop,
      note: spec.note,
      isArchived: false,
      createdAt,
      updatedAt: today,
    });

    // Fiyat serisi: tohumlu rastgele yürüyüş (göreli şekil)
    let price = spec.start;
    const series: { date: number; price: number }[] = [];
    for (let d = horizon; d >= 0; d--) {
      const date = today - d * DAY;
      const shock = (rand() - 0.5) * 2 * spec.vol;
      price = Math.max(0.01, price * (1 + spec.driftDaily + shock));
      series.push({ date, price });
    }
    // Seriyi bugünkü gerçekçi fiyata (current) çıpala — "Fiyatları güncelle"
    // gerçek fiyatı yazınca dikey sıçrama olmasın.
    const lastPrice = series[series.length - 1].price || spec.current;
    const scale = spec.current / lastPrice;
    for (const pt of series) pt.price = round2(pt.price * scale);
    for (const pt of series) {
      priceSnapshots.push({
        id: `${spec.id}-p-${pt.date}`,
        assetId: spec.id,
        date: pt.date,
        price: pt.price,
        source: "manuel",
      });
    }

    // İlk alış — o günkü fiyata yakın
    const buyPrice = priceForDay(series, spec.buyDayAgo, today, spec.start);
    transactions.push({
      id: `${spec.id}-t0`,
      assetId: spec.id,
      side: "buy",
      date: today - spec.buyDayAgo * DAY,
      units: spec.units,
      pricePerUnit: round2(buyPrice),
      fee: round2(buyPrice * spec.units * 0.002),
      note: "İlk alış",
      createdAt: today - spec.buyDayAgo * DAY,
    });

    if (spec.extraBuy) {
      const p = priceForDay(series, spec.extraBuy.dayAgo, today, spec.start);
      transactions.push({
        id: `${spec.id}-t1`,
        assetId: spec.id,
        side: "buy",
        date: today - spec.extraBuy.dayAgo * DAY,
        units: spec.extraBuy.units,
        pricePerUnit: round2(p),
        fee: round2(p * spec.extraBuy.units * 0.002),
        note: "Ek alış",
        createdAt: today - spec.extraBuy.dayAgo * DAY,
      });
    }
    if (spec.sell) {
      const p = priceForDay(series, spec.sell.dayAgo, today, spec.start);
      transactions.push({
        id: `${spec.id}-s0`,
        assetId: spec.id,
        side: "sell",
        date: today - spec.sell.dayAgo * DAY,
        units: spec.sell.units,
        pricePerUnit: round2(p),
        fee: round2(p * spec.sell.units * 0.002),
        note: "Kısmi satış",
        createdAt: today - spec.sell.dayAgo * DAY,
      });
    }
  }

  // Makro: aylık TÜFE, BIST100, gram altın, USD/TRY, mevduat faizi
  const macroSnapshots: MacroSnapshot[] = [];
  let cpi = 100;
  let bist = 9200;
  for (let m = 4; m >= 0; m--) {
    const date = today - m * 30 * DAY;
    cpi = round2(cpi * 1.031);
    bist = round2(bist * 1.028);
    macroSnapshots.push({
      id: `macro-${date}`,
      date,
      cpiIndex: cpi,
      bist100: bist,
      gramGold: round2(2380 * Math.pow(1.025, 4 - m)),
      usdTry: round2(31.8 * Math.pow(1.012, 4 - m)),
      depositRateAnnual: 0.45,
    });
  }

  const goals: Goal[] = [
    {
      id: "g-1",
      title: "1 Milyon ₺ portföy",
      targetAmount: 1_000_000,
      targetDate: today + 540 * DAY,
      createdAt: today - 90 * DAY,
    },
  ];

  const ipos: IpoEntry[] = [
    {
      id: "ipo-1",
      name: "Örnek Enerji A.Ş.",
      ticker: "ORNEN",
      price: 18.5,
      demandDate: today + 9 * DAY,
      lot: 1,
      publicFloatPct: 0.28,
      participationEligible: true,
      note: "Katılım endeksine uygun.",
      createdAt: today - 2 * DAY,
    },
  ];

  return {
    assets,
    transactions,
    priceSnapshots,
    macroSnapshots,
    alerts: [],
    alertRules: defaultAlertRules(),
    goals,
    ipos,
  };
}

function defaultAlertRules(): PortfolioData["alertRules"] {
  return [
    { id: "r-streak-up", enabled: true, type: "streak_up", channels: ["inapp"] },
    { id: "r-streak-down", enabled: true, type: "streak_down", channels: ["inapp"] },
    { id: "r-target", enabled: true, type: "target_hit", channels: ["inapp", "push"] },
    { id: "r-stop", enabled: true, type: "stoploss_hit", channels: ["inapp", "push"] },
    { id: "r-daily", enabled: true, type: "daily_move", threshold: 0.05, channels: ["inapp"] },
    { id: "r-real", enabled: true, type: "real_return_flip", channels: ["inapp"] },
  ];
}

function priceForDay(
  series: { date: number; price: number }[],
  dayAgo: number,
  today: number,
  fallback: number,
): number {
  const target = today - dayAgo * DAY;
  const hit = series.find((s) => s.date === target);
  return hit?.price ?? fallback;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
