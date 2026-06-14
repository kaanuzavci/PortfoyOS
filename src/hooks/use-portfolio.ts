"use client";

import { useMemo } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { computePortfolio, type PortfolioComputed } from "@/lib/calc";
import type { PortfolioData } from "@/types";

export interface UsePortfolioResult extends PortfolioComputed {
  hydrated: boolean;
  isEmpty: boolean;
  raw: PortfolioData;
  now: number;
}

/** Store'dan ham veriyi okur ve hesaplama motorundan türetilmiş metrikleri verir. */
export function usePortfolio(): UsePortfolioResult {
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const costMethod = usePortfolioStore((s) => s.costMethod);
  const assets = usePortfolioStore((s) => s.assets);
  const transactions = usePortfolioStore((s) => s.transactions);
  const priceSnapshots = usePortfolioStore((s) => s.priceSnapshots);
  const macroSnapshots = usePortfolioStore((s) => s.macroSnapshots);
  const alerts = usePortfolioStore((s) => s.alerts);
  const alertRules = usePortfolioStore((s) => s.alertRules);
  const goals = usePortfolioStore((s) => s.goals);
  const ipos = usePortfolioStore((s) => s.ipos);

  const raw = useMemo<PortfolioData>(
    () => ({
      assets,
      transactions,
      priceSnapshots,
      macroSnapshots,
      alerts,
      alertRules,
      goals,
      ipos,
    }),
    [assets, transactions, priceSnapshots, macroSnapshots, alerts, alertRules, goals, ipos],
  );

  // now'ı veriden türet (test ve SSR tutarlılığı için kararlı): en son snapshot/işlem
  const now = useMemo(() => {
    const dates = [
      ...priceSnapshots.map((s) => s.date),
      ...transactions.map((t) => t.date),
    ];
    return dates.length ? Math.max(Date.now(), ...dates) : Date.now();
  }, [priceSnapshots, transactions]);

  const computed = useMemo(
    () => computePortfolio(raw, now, costMethod),
    [raw, now, costMethod],
  );

  return {
    ...computed,
    raw,
    now,
    hydrated,
    isEmpty: assets.filter((a) => !a.isArchived).length === 0,
  };
}
