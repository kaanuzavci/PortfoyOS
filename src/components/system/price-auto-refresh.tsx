"use client";

import { useEffect, useRef } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { usePriceRefresh } from "@/hooks/use-price-refresh";

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

/**
 * Görünmez — uygulama açıldığında son çekimden 12 saatten fazla geçtiyse
 * fiyatları sessizce bir kez yeniler. (Yerel mod için "otomatik" deneyim.)
 */
export function PriceAutoRefresh() {
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const lastPriceFetch = usePortfolioStore((s) => s.lastPriceFetch);
  const assetCount = usePortfolioStore((s) => s.assets.length);
  const { refresh } = usePriceRefresh();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !hydrated || assetCount === 0) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    if (Date.now() - lastPriceFetch < TWELVE_HOURS) return;
    ran.current = true;
    refresh().catch(() => {
      /* sessiz; manuel her zaman çalışır */
    });
  }, [hydrated, lastPriceFetch, assetCount, refresh]);

  return null;
}
