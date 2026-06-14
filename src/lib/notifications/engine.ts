// Bildirim üretim motoru (SAF). Portföy durumunu değerlendirir, aday bildirimleri
// kararlı `key`'lerle döndürür. Tekrarı önlemek (spam yok) için emisyon katmanı
// `key`'leri "görülenler" kümesiyle karşılaştırır.
import type { PortfolioData, Alert, AlertRule, AlertType } from "@/types";
import type { PortfolioComputed } from "@/lib/calc";
import { snapTryPrice } from "@/lib/calc";
import { formatTRY, formatSignedPercent } from "@/lib/format";

export interface AlertCandidate {
  key: string;
  type: AlertType;
  assetId?: string;
  level?: number;
  title: string;
  body: string;
  severity: Alert["severity"];
}

const MILESTONES = [
  50_000, 100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
];

function ruleEnabled(rules: AlertRule[], type: AlertType): boolean {
  const r = rules.find((x) => x.type === type);
  return r ? r.enabled : true; // kural yoksa varsayılan açık
}

function ruleThreshold(rules: AlertRule[], type: AlertType, fallback: number): number {
  return rules.find((x) => x.type === type)?.threshold ?? fallback;
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function evaluateAlerts(
  computed: PortfolioComputed,
  data: PortfolioData,
  now: number = Date.now(),
): AlertCandidate[] {
  const out: AlertCandidate[] = [];
  const rules = data.alertRules;
  const { summary, positions, active } = computed;

  // Varlık başına sıralı fiyat tarihleri (seri başlangıcı için)
  const datesByAsset = new Map<string, number[]>();
  for (const p of positions) {
    datesByAsset.set(
      p.assetId,
      data.priceSnapshots
        .filter((s) => s.assetId === p.assetId)
        .map((s) => s.date)
        .sort((a, b) => a - b),
    );
  }

  // 1) Seri seviyeleri — varlık bazında
  if (ruleEnabled(rules, "streak_up") || ruleEnabled(rules, "streak_down")) {
    for (const p of active) {
      const st = p.streak;
      if (!st.level) continue;
      const isUp = st.direction === "up";
      if (isUp && !ruleEnabled(rules, "streak_up")) continue;
      if (!isUp && !ruleEnabled(rules, "streak_down")) continue;
      const dates = datesByAsset.get(p.assetId) ?? [];
      const startDate = dates[dates.length - 1 - st.length] ?? dates[0] ?? now;
      out.push({
        key: `streak:${p.assetId}:${st.direction}:L${st.level.level}:${dayKey(startDate)}`,
        type: isUp ? "streak_up" : "streak_down",
        assetId: p.assetId,
        level: st.level.level,
        title: `${p.asset.ticker || p.asset.name}: ${st.level.name} seviyesi`,
        body: `${isUp ? "Kâr" : "Zarar"} serisi ${st.length} güne ulaştı (${st.level.name}).`,
        severity: isUp ? "success" : "warning",
      });
    }
  }

  // 2) Portföy serisi
  const ps = summary.portfolioStreak;
  if (ps.level && computed.series.length) {
    const isUp = ps.direction === "up";
    if ((isUp && ruleEnabled(rules, "streak_up")) || (!isUp && ruleEnabled(rules, "streak_down"))) {
      const idx = computed.series.length - 1 - ps.length;
      const startDate = computed.series[Math.max(0, idx)]?.date ?? now;
      out.push({
        key: `streak:portfolio:${ps.direction}:L${ps.level.level}:${dayKey(startDate)}`,
        type: isUp ? "streak_up" : "streak_down",
        level: ps.level.level,
        title: `Portföy: ${ps.level.name} seviyesi`,
        body: `Portföy ${isUp ? "kâr" : "zarar"} serisi ${ps.length} gün (${ps.level.name}).`,
        severity: isUp ? "success" : "warning",
      });
    }
  }

  // 3) Hedef / stop
  for (const p of active) {
    const a = p.asset;
    if (a.targetPrice && p.latestPrice >= a.targetPrice && ruleEnabled(rules, "target_hit")) {
      out.push({
        key: `target:${a.id}`,
        type: "target_hit",
        assetId: a.id,
        title: `${a.ticker || a.name} hedefe ulaştı 🎯`,
        body: `Güncel fiyat ${formatTRY(p.latestPrice)}, hedef ${formatTRY(a.targetPrice)}.`,
        severity: "success",
      });
    }
    if (a.stopLossPrice && p.latestPrice <= a.stopLossPrice && ruleEnabled(rules, "stoploss_hit")) {
      out.push({
        key: `stop:${a.id}`,
        type: "stoploss_hit",
        assetId: a.id,
        title: `${a.ticker || a.name} stop-loss seviyesinde ⚠️`,
        body: `Güncel fiyat ${formatTRY(p.latestPrice)}, stop ${formatTRY(a.stopLossPrice)}.`,
        severity: "danger",
      });
    }
  }

  // 4) Günlük hareket eşiği (portföy)
  if (ruleEnabled(rules, "daily_move") && computed.series.length >= 2) {
    const threshold = ruleThreshold(rules, "daily_move", 0.05);
    if (Math.abs(summary.dayChangePct) >= threshold) {
      const lastDate = computed.series[computed.series.length - 1].date;
      out.push({
        key: `daily:portfolio:${dayKey(lastDate)}`,
        type: "daily_move",
        title: `Portföyde sert hareket`,
        body: `Bugün ${formatSignedPercent(summary.dayChangePct)} (${formatTRY(summary.dayChange)}).`,
        severity: summary.dayChange >= 0 ? "info" : "warning",
      });
    }
  }

  // 5) Reel getiri dönüşü
  if (ruleEnabled(rules, "real_return_flip") && summary.realReturnPct < 0 && summary.totalReturnPct >= 0) {
    out.push({
      key: `real_flip:${new Date(now).toISOString().slice(0, 7)}`,
      type: "real_return_flip",
      title: "Reel getiri negatife döndü",
      body: `Nominal ${formatSignedPercent(summary.totalReturnPct)} pozitif ama enflasyon sonrası reel getiri ${formatSignedPercent(summary.realReturnPct)}.`,
      severity: "warning",
    });
  }

  // 6) Kilometre taşı
  if (ruleEnabled(rules, "milestone")) {
    for (const m of MILESTONES) {
      if (summary.totalValue >= m) {
        out.push({
          key: `milestone:${m}`,
          type: "milestone",
          title: `Kilometre taşı: ${formatTRY(m)} 🏁`,
          body: `Portföy değerin ${formatTRY(m)} eşiğini geçti.`,
          severity: "success",
        });
      }
    }
  }

  // 7) Yeni halka arz
  if (ruleEnabled(rules, "ipo_new")) {
    for (const ipo of data.ipos) {
      out.push({
        key: `ipo:${ipo.id}`,
        type: "ipo_new",
        title: `Halka arz: ${ipo.name}`,
        body: `${ipo.ticker}${ipo.demandDate ? ` · talep ${dayKey(ipo.demandDate)}` : ""}.`,
        severity: "info",
      });
    }
  }

  return out;
}
