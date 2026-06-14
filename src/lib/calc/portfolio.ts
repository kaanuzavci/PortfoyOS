// Üst düzey portföy toplayıcı — ham veriden (varlık + işlem + fiyat + makro)
// dashboard'un ihtiyaç duyduğu tüm metrikleri türetir. SAF.
import type { Asset, AssetType, PortfolioData } from "@/types";
import {
  computePosition,
  latestPriceOf,
  snapTryPrice,
  type PositionResult,
  type CostMethod,
} from "./position";
import { portfolioValueSeries, type ValuePoint } from "./timeseries";
import { xirr, type CashFlow } from "./xirr";
import { detectStreak, type StreakResult } from "./streak";
import { inflationBetween, realReturn } from "./real-return";
import { txTryPrice } from "./position";

export interface AssetPosition extends PositionResult {
  asset: Asset;
  streak: StreakResult;
  weight: number; // güncel değerin portföy içindeki payı
  dayChange: number; // son güne göre TRY değişim
  dayChangePct: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalInvested: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalPnl: number;
  totalReturnPct: number;
  dayChange: number;
  dayChangePct: number;
  xirr: number | null;
  inflation: number;
  realReturnPct: number;
  portfolioStreak: StreakResult;
}

export interface AllocationSlice {
  key: string;
  label: string;
  value: number;
  pct: number;
}

export interface PortfolioComputed {
  positions: AssetPosition[];
  active: AssetPosition[];
  summary: PortfolioSummary;
  series: ValuePoint[];
  allocationByType: AllocationSlice[];
  allocationByAsset: AllocationSlice[];
}

const TYPE_LABELS: Record<AssetType, string> = {
  fon: "Fon",
  hisse: "Hisse",
  halka_arz: "Halka Arz",
  altin: "Altın",
  doviz: "Döviz",
  mevduat: "Mevduat",
  kripto: "Kripto",
  diger: "Diğer",
};

export function computePortfolio(
  data: PortfolioData,
  now: number = Date.now(),
  method: CostMethod = "average",
): PortfolioComputed {
  const { assets, transactions, priceSnapshots, macroSnapshots } = data;
  const visibleAssets = assets.filter((a) => !a.isArchived);

  const series = portfolioValueSeries(visibleAssets, transactions, priceSnapshots);

  // Her varlık için sıralı fiyat serisi (gün değişimi & seri için)
  const snapsByAsset = new Map<string, { date: number; price: number }[]>();
  for (const a of visibleAssets) {
    snapsByAsset.set(
      a.id,
      priceSnapshots
        .filter((s) => s.assetId === a.id)
        .map((s) => ({ date: s.date, price: snapTryPrice(s) }))
        .sort((x, y) => x.date - y.date),
    );
  }

  const positions: AssetPosition[] = visibleAssets.map((asset) => {
    const pos = computePosition(asset.id, transactions, priceSnapshots, now, method);
    const snaps = snapsByAsset.get(asset.id) ?? [];
    const streak = detectStreak(snaps.map((s) => s.price));

    let dayChange = 0;
    let dayChangePct = 0;
    if (snaps.length >= 2 && pos.heldUnits > 0) {
      const last = snaps[snaps.length - 1].price;
      const prev = snaps[snaps.length - 2].price;
      dayChange = (last - prev) * pos.heldUnits;
      dayChangePct = prev > 0 ? (last - prev) / prev : 0;
    }

    return {
      ...pos,
      asset,
      streak,
      weight: 0,
      dayChange,
      dayChangePct,
    };
  });

  const active = positions.filter((p) => p.heldUnits > 0);
  const totalValue = active.reduce((s, p) => s + p.currentValue, 0);
  for (const p of active) {
    p.weight = totalValue > 0 ? p.currentValue / totalValue : 0;
  }

  const totalCostBasis = active.reduce((s, p) => s + p.costBasis, 0);
  const totalInvested = positions.reduce((s, p) => s + p.totalInvested, 0);
  const totalUnrealizedPnl = active.reduce((s, p) => s + p.unrealizedPnl, 0);
  const totalRealizedPnl = positions.reduce((s, p) => s + p.realizedPnl, 0);
  const totalPnl = totalUnrealizedPnl + totalRealizedPnl;
  const totalReturnPct = totalInvested > 0 ? totalPnl / totalInvested : 0;

  // Günlük değişim — değer serisinin son iki noktası
  let dayChange = 0;
  let dayChangePct = 0;
  if (series.length >= 2) {
    const last = series[series.length - 1].value;
    const prev = series[series.length - 2].value;
    dayChange = last - prev;
    dayChangePct = prev > 0 ? (last - prev) / prev : 0;
  }

  // XIRR — tüm nakit akışları + güncel değer
  const flows: CashFlow[] = [];
  for (const t of transactions) {
    const cash = t.units * txTryPrice(t) + (t.side === "buy" ? (t.fee ?? 0) : -(t.fee ?? 0));
    flows.push({ date: t.date, amount: t.side === "buy" ? -cash : cash });
  }
  if (totalValue > 0) flows.push({ date: now, amount: totalValue });
  const portfolioXirr = xirr(flows);

  // Reel getiri (tüm zamanlar)
  const firstDate = transactions.length
    ? Math.min(...transactions.map((t) => t.date))
    : now;
  const inflation = inflationBetween(macroSnapshots, firstDate, now);
  const realReturnPct = realReturn(totalReturnPct, inflation);

  const portfolioStreak = detectStreak(series.map((p) => p.value));

  // Dağılımlar
  const byTypeMap = new Map<string, number>();
  for (const p of active) {
    byTypeMap.set(p.asset.type, (byTypeMap.get(p.asset.type) ?? 0) + p.currentValue);
  }
  const allocationByType: AllocationSlice[] = [...byTypeMap.entries()]
    .map(([key, value]) => ({
      key,
      label: TYPE_LABELS[key as AssetType] ?? key,
      value,
      pct: totalValue > 0 ? value / totalValue : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const allocationByAsset: AllocationSlice[] = active
    .map((p) => ({
      key: p.asset.id,
      label: p.asset.ticker || p.asset.name,
      value: p.currentValue,
      pct: p.weight,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    positions,
    active,
    series,
    allocationByType,
    allocationByAsset,
    summary: {
      totalValue,
      totalCostBasis,
      totalInvested,
      totalUnrealizedPnl,
      totalRealizedPnl,
      totalPnl,
      totalReturnPct,
      dayChange,
      dayChangePct,
      xirr: portfolioXirr,
      inflation,
      realReturnPct,
      portfolioStreak,
    },
  };
}

/** En çok kazandıran/kaybettiren sıralaması (%'ye veya mutlak TL'ye göre). */
export function rankMovers(
  positions: AssetPosition[],
  by: "pct" | "abs",
): AssetPosition[] {
  const arr = positions.filter((p) => p.heldUnits > 0);
  return [...arr].sort((a, b) =>
    by === "pct"
      ? b.unrealizedPnlPct - a.unrealizedPnlPct
      : b.unrealizedPnl - a.unrealizedPnl,
  );
}

export { latestPriceOf };
