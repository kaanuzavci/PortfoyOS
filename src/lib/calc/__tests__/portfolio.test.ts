import { describe, it, expect } from "vitest";
import { computePortfolio, rankMovers } from "../portfolio";
import { generateSeed } from "@/lib/demo/seed";

describe("computePortfolio (demo veri)", () => {
  const now = Date.UTC(2026, 5, 14);
  const data = generateSeed(now);
  const result = computePortfolio(data, now);

  it("aktif pozisyonlar ve toplam değer üretir", () => {
    expect(result.active.length).toBeGreaterThan(0);
    expect(result.summary.totalValue).toBeGreaterThan(0);
  });

  it("ağırlıklar toplamı ~1", () => {
    const sum = result.active.reduce((s, p) => s + p.weight, 0);
    expect(sum).toBeCloseTo(1, 4);
  });

  it("toplam K/Z = gerçekleşmiş + gerçekleşmemiş", () => {
    const { totalPnl, totalRealizedPnl, totalUnrealizedPnl } = result.summary;
    expect(totalPnl).toBeCloseTo(totalRealizedPnl + totalUnrealizedPnl, 2);
  });

  it("değer serisi kronolojik ve dolu", () => {
    expect(result.series.length).toBeGreaterThan(10);
    for (let i = 1; i < result.series.length; i++) {
      expect(result.series[i].date).toBeGreaterThan(result.series[i - 1].date);
    }
  });

  it("reel getiri nominalden düşük (enflasyon pozitif)", () => {
    expect(result.summary.realReturnPct).toBeLessThan(
      result.summary.totalReturnPct,
    );
  });

  it("rankMovers %'ye göre azalan sıralar", () => {
    const ranked = rankMovers(result.active, "pct");
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].unrealizedPnlPct).toBeGreaterThanOrEqual(
        ranked[i].unrealizedPnlPct,
      );
    }
  });

  it("dağılım yüzdeleri toplamı ~1", () => {
    const sum = result.allocationByType.reduce((s, a) => s + a.pct, 0);
    expect(sum).toBeCloseTo(1, 4);
  });
});
