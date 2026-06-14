"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { usePortfolio } from "./use-portfolio";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { evaluateAlerts } from "@/lib/notifications/engine";
import type { Alert } from "@/types";

const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function toastFor(a: Alert) {
  const fn =
    a.severity === "success"
      ? toast.success
      : a.severity === "danger"
        ? toast.error
        : a.severity === "warning"
          ? toast.warning
          : toast.info;
  fn(a.title, { description: a.body });
}

/**
 * Bildirim motorunu veri değiştikçe çalıştırır: aday bildirimleri üretir,
 * tekrarları eler, seri kırılmalarını tespit eder ve yeni bildirimleri toast'lar.
 * Uygulama layout'unda bir kez monte edilir.
 */
export function useNotificationEngine() {
  const pf = usePortfolio();
  const emitAlert = usePortfolioStore((s) => s.emitAlert);
  const streakMemory = usePortfolioStore((s) => s.streakMemory);
  const setStreakMemory = usePortfolioStore((s) => s.setStreakMemory);

  useEffect(() => {
    if (!pf.hydrated || pf.isEmpty) return;

    const created: Alert[] = [];

    // 1) Seri kırılması — hafızadaki seriyle karşılaştır
    const current: Record<string, { dir: string; length: number }> = {
      portfolio: {
        dir: pf.summary.portfolioStreak.direction,
        length: pf.summary.portfolioStreak.length,
      },
    };
    for (const p of pf.active) {
      current[p.assetId] = { dir: p.streak.direction, length: p.streak.length };
    }

    for (const [key, prev] of Object.entries(streakMemory)) {
      if (prev.length < 3) continue; // yalnızca kayda değer seriler
      const now = current[key];
      const broke = !now || now.dir !== prev.dir || now.length < prev.length;
      if (broke) {
        const label =
          key === "portfolio"
            ? "Portföy"
            : pf.positions.find((p) => p.assetId === key)?.asset.ticker ??
              "Varlık";
        const a = emitAlert(`broken:${key}:${dayKey(pf.now)}`, {
          type: "streak_broken",
          assetId: key === "portfolio" ? undefined : key,
          title: `${label}: seri sona erdi`,
          body: `${prev.dir === "up" ? "Kâr" : "Zarar"} serisi ${prev.length} günde sona erdi.`,
          severity: "info",
        });
        if (a) created.push(a);
      }
    }
    setStreakMemory(current);

    // 2) Aday bildirimleri değerlendir
    const candidates = evaluateAlerts(pf, pf.raw, pf.now);
    for (const c of candidates) {
      const a = emitAlert(c.key, {
        type: c.type,
        assetId: c.assetId,
        level: c.level,
        title: c.title,
        body: c.body,
        severity: c.severity,
      });
      if (a) created.push(a);
    }

    // 3) Toast — az sayıda ise tek tek, çoksa özet (spam yok)
    if (created.length === 0) return;
    if (created.length <= 3) {
      created.forEach(toastFor);
    } else {
      toast.info(`${created.length} yeni bildirim`, {
        description: "Ayrıntılar için bildirim merkezine bak.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pf.hydrated,
    pf.raw.transactions,
    pf.raw.priceSnapshots,
    pf.raw.macroSnapshots,
    pf.raw.assets,
    pf.raw.ipos,
    pf.raw.alertRules,
  ]);
}
