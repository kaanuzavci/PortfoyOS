"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { usePortfolioStore } from "@/stores/portfolio-store";
import {
  subscribePortfolio,
  savePortfolio,
  portfolioSignature,
} from "@/lib/firebase/sync";
import type { PortfolioData } from "@/types";

function currentData(): PortfolioData {
  const s = usePortfolioStore.getState();
  return {
    assets: s.assets,
    transactions: s.transactions,
    priceSnapshots: s.priceSnapshots,
    macroSnapshots: s.macroSnapshots,
    alerts: s.alerts,
    alertRules: s.alertRules,
    goals: s.goals,
    ipos: s.ipos,
  };
}

/**
 * Firebase modunda portföyü bulutla iki yönlü senkronlar:
 * - onSnapshot ile uzaktan gelen değişiklikleri yerel store'a yazar,
 * - yerel değişiklikleri debounce'layıp buluta yazar.
 * Yerel modda hiçbir şey yapmaz. Echo döngüsü imza karşılaştırmasıyla önlenir.
 */
export function useFirestoreSync() {
  const { user, mode } = useAuth();
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const hydrateFromCloud = usePortfolioStore((s) => s.hydrateFromCloud);

  // Değişiklik tetikleyiciler (kaydetme effect'i bunlara bağlı)
  const assets = usePortfolioStore((s) => s.assets);
  const transactions = usePortfolioStore((s) => s.transactions);
  const priceSnapshots = usePortfolioStore((s) => s.priceSnapshots);
  const macroSnapshots = usePortfolioStore((s) => s.macroSnapshots);
  const alerts = usePortfolioStore((s) => s.alerts);
  const alertRules = usePortfolioStore((s) => s.alertRules);
  const goals = usePortfolioStore((s) => s.goals);
  const ipos = usePortfolioStore((s) => s.ipos);

  const lastSig = useRef<string | null>(null);
  const enabled = mode === "firebase" && !!user;

  // Uzaktan dinle
  useEffect(() => {
    if (!enabled || !user) return;
    let unsub = () => {};
    let active = true;
    (async () => {
      unsub = await subscribePortfolio(
        user.uid,
        (cloud) => {
          if (!active) return;
          if (cloud === null) {
            // Bulutta veri yok → mevcut yerel veriyi buluta taşı (ilk kurulum)
            const local = currentData();
            lastSig.current = portfolioSignature(local);
            savePortfolio(user.uid, local).catch(() => {});
            return;
          }
          const sig = portfolioSignature(cloud);
          if (sig !== lastSig.current) {
            lastSig.current = sig;
            hydrateFromCloud(cloud);
          }
        },
        (e) => console.error("Firestore senkron hatası:", e),
      );
    })();
    return () => {
      active = false;
      unsub();
      lastSig.current = null;
    };
  }, [enabled, user, hydrateFromCloud]);

  // Yerel değişiklikleri buluta yaz (debounce)
  useEffect(() => {
    if (!enabled || !user || !hydrated) return;
    if (lastSig.current === null) return; // henüz buluttan ilk durum gelmedi
    const data = currentData();
    const sig = portfolioSignature(data);
    if (sig === lastSig.current) return;
    const t = setTimeout(() => {
      lastSig.current = sig;
      savePortfolio(user.uid, data).catch((e) =>
        console.error("Buluta yazılamadı:", e),
      );
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    user,
    hydrated,
    assets,
    transactions,
    priceSnapshots,
    macroSnapshots,
    alerts,
    alertRules,
    goals,
    ipos,
  ]);
}
