"use client";

import { useCallback, useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { authHeaders } from "@/lib/firebase/client-tokens";
import type { Asset } from "@/types";

interface HistoryApiRow {
  id: string;
  points: { date: number; price: number }[];
  source: string;
}

interface BackfillSummary {
  filled: number; // geçmiş gelen varlık sayısı
  total: number;
}

/** Varlıkların gerçek fiyat geçmişini /api/history'den çekip store'a işler. */
export function useHistoryBackfill() {
  const allAssets = usePortfolioStore((s) => s.assets);
  const mergeHistory = usePortfolioStore((s) => s.mergeHistory);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const backfill = useCallback(
    async (assets?: Asset[], replace = false): Promise<BackfillSummary> => {
      const targets = (assets ?? allAssets).filter(
        (a) => !a.isArchived && a.ticker && a.type !== "fon",
      );
      if (targets.length === 0) return { filled: 0, total: 0 };
      setIsBackfilling(true);
      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({
            assets: targets.map((a) => ({
              id: a.id,
              ticker: a.ticker,
              type: a.type,
              currency: a.currency,
            })),
            range: "1y",
          }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = (await res.json()) as { results: HistoryApiRow[] };
        let filled = 0;
        for (const r of data.results) {
          if (r.points.length > 0) {
            mergeHistory(r.id, r.points, r.source, replace);
            filled++;
          }
        }
        return { filled, total: targets.length };
      } finally {
        setIsBackfilling(false);
      }
    },
    [allAssets, mergeHistory],
  );

  return { backfill, isBackfilling };
}
