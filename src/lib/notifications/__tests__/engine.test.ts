import { describe, it, expect } from "vitest";
import { evaluateAlerts } from "../engine";
import { computePortfolio } from "@/lib/calc";
import { generateSeed } from "@/lib/demo/seed";
import type { PortfolioData } from "@/types";

const now = Date.UTC(2026, 5, 14);

describe("evaluateAlerts", () => {
  const data = generateSeed(now);
  const computed = computePortfolio(data, now);
  const candidates = evaluateAlerts(computed, data, now);

  it("aday bildirim üretir", () => {
    expect(candidates.length).toBeGreaterThan(0);
  });

  it("key'ler benzersiz", () => {
    const keys = candidates.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("seed'deki halka arz için ipo bildirimi üretir", () => {
    expect(candidates.some((c) => c.type === "ipo_new")).toBe(true);
  });

  it("devre dışı kural bildirim üretmez", () => {
    const off: PortfolioData = {
      ...data,
      alertRules: data.alertRules.map((r) => ({ ...r, enabled: false })),
      ipos: [],
    };
    // ipo_new kuralı yok → varsayılan açık; ipos boş olduğu için ipo yok.
    const c2 = evaluateAlerts(computePortfolio(off, now), off, now);
    expect(c2.some((c) => c.type === "streak_up")).toBe(false);
    expect(c2.some((c) => c.type === "streak_down")).toBe(false);
  });

  it("hedefe ulaşan varlık target_hit üretir", () => {
    const d2: PortfolioData = {
      assets: [
        {
          id: "x",
          name: "Test",
          type: "hisse",
          currency: "TRY",
          targetPrice: 10,
          isArchived: false,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      transactions: [
        { id: "t", assetId: "x", side: "buy", date: 0, units: 10, pricePerUnit: 8, createdAt: 0 },
      ],
      priceSnapshots: [
        { id: "p1", assetId: "x", date: 0, price: 8, source: "test" },
        { id: "p2", assetId: "x", date: 86_400_000, price: 12, source: "test" },
      ],
      macroSnapshots: [],
      alerts: [],
      alertRules: [],
      goals: [],
      ipos: [],
    };
    const c = evaluateAlerts(computePortfolio(d2, 2 * 86_400_000), d2, 2 * 86_400_000);
    expect(c.some((x) => x.type === "target_hit" && x.assetId === "x")).toBe(true);
  });
});
