"use client";

import { useCallback, useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { authHeaders } from "@/lib/firebase/client-tokens";
import type { Asset } from "@/types";

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

async function fetchMarketPrices(
  items: { id: string; ticker?: string; type: Asset["type"]; currency: string }[],
): Promise<PriceApiResult[]> {
  const res = await fetch("/api/prices", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ assets: items }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = (await res.json()) as { results: PriceApiResult[] };
  return data.results;
}

/** Aktif varlıkların fiyatlarını /api/prices üzerinden çeker ve store'a yazar. */
export function usePriceRefresh() {
  const assets = usePortfolioStore((s) => s.assets);
  const setAutoPrice = usePortfolioStore((s) => s.setAutoPrice);
  const updateAsset = usePortfolioStore((s) => s.updateAsset);
  const setLastPriceFetch = usePortfolioStore((s) => s.setLastPriceFetch);
  const [isFetching, setIsFetching] = useState(false);

  const refresh = useCallback(async (): Promise<RefreshSummary> => {
    // "manual" modundaki varlıklar otomatik güncellemeye dahil edilmez.
    const active = assets.filter(
      (a) => !a.isArchived && a.ticker && a.priceMode !== "manual",
    );
    if (active.length === 0) {
      setLastPriceFetch(Date.now());
      return { updated: 0, skipped: 0, total: 0 };
    }
    setIsFetching(true);
    try {
      const results = await fetchMarketPrices(
        active.map((a) => ({
          id: a.id,
          ticker: a.ticker,
          type: a.type,
          currency: a.currency,
        })),
      );
      let updated = 0;
      for (const r of results) {
        if (!r.ok || r.price == null) continue;
        const asset = active.find((a) => a.id === r.id);
        // Banka makası modunda piyasa fiyatına makas uygulanır.
        if (asset?.priceMode === "spread" && typeof asset.spreadPct === "number") {
          setAutoPrice(r.id, r.price * (1 + asset.spreadPct), "banka");
        } else {
          setAutoPrice(r.id, r.price, r.source);
        }
        updated++;
      }
      setLastPriceFetch(Date.now());
      return { updated, skipped: active.length - updated, total: active.length };
    } finally {
      setIsFetching(false);
    }
  }, [assets, setAutoPrice, setLastPriceFetch]);

  /**
   * Banka makasını kalibre eder: o anki piyasa fiyatını çeker, kullanıcının
   * girdiği banka fiyatıyla farkı (%) hesaplar, varlığa kaydeder ve fiyatı set eder.
   * Hafta içi gündüz (piyasa normalken) yapılması önerilir.
   */
  const calibrate = useCallback(
    async (asset: Asset, bankPrice: number): Promise<number> => {
      const [r] = await fetchMarketPrices([
        { id: asset.id, ticker: asset.ticker, type: asset.type, currency: asset.currency },
      ]);
      if (!r || !r.ok || r.price == null || r.price <= 0) {
        throw new Error("Piyasa fiyatı alınamadı");
      }
      const spreadPct = bankPrice / r.price - 1;
      updateAsset(asset.id, {
        priceMode: "spread",
        spreadPct,
        priceSource: "banka",
      });
      setAutoPrice(asset.id, bankPrice, "banka");
      return spreadPct;
    },
    [updateAsset, setAutoPrice],
  );

  return { refresh, calibrate, isFetching };
}
