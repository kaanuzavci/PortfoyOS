"use client";

import { useCallback, useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";

interface RefreshSummary {
  updated: number;
  skipped: number;
  total: number;
}

interface PriceApiResult {
  id: string;
  price: number | null;
  source: string;
  ok: boolean;
}

/** Aktif varlıkların fiyatlarını /api/prices üzerinden çeker ve store'a yazar. */
export function usePriceRefresh() {
  const assets = usePortfolioStore((s) => s.assets);
  const setAutoPrice = usePortfolioStore((s) => s.setAutoPrice);
  const setLastPriceFetch = usePortfolioStore((s) => s.setLastPriceFetch);
  const [isFetching, setIsFetching] = useState(false);

  const refresh = useCallback(async (): Promise<RefreshSummary> => {
    const active = assets.filter((a) => !a.isArchived && a.ticker);
    if (active.length === 0) {
      setLastPriceFetch(Date.now());
      return { updated: 0, skipped: 0, total: 0 };
    }
    setIsFetching(true);
    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assets: active.map((a) => ({
            id: a.id,
            ticker: a.ticker,
            type: a.type,
            currency: a.currency,
          })),
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as { results: PriceApiResult[] };
      let updated = 0;
      for (const r of data.results) {
        if (r.ok && r.price != null) {
          setAutoPrice(r.id, r.price, r.source);
          updated++;
        }
      }
      setLastPriceFetch(Date.now());
      return {
        updated,
        skipped: active.length - updated,
        total: active.length,
      };
    } finally {
      setIsFetching(false);
    }
  }, [assets, setAutoPrice, setLastPriceFetch]);

  return { refresh, isFetching };
}
