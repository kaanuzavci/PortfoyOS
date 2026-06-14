import { describe, it, expect } from "vitest";
import { inflationBetween, realReturn } from "../real-return";
import type { MacroSnapshot } from "@/types";

const D = 86_400_000;
function macro(dayOffset: number, cpi: number): MacroSnapshot {
  return {
    id: `m${dayOffset}`,
    date: dayOffset * D,
    cpiIndex: cpi,
    bist100: 0,
    gramGold: 0,
    usdTry: 0,
    depositRateAnnual: 0.4,
  };
}

describe("reel getiri", () => {
  it("TÜFE endeksinden enflasyon hesaplar", () => {
    const m = [macro(0, 100), macro(30, 110)];
    expect(inflationBetween(m, 0, 30 * D)).toBeCloseTo(0.1);
  });

  it("realReturn nominal getiriyi enflasyona göre düzeltir", () => {
    expect(realReturn(0.2, 0.1)).toBeCloseTo(1.2 / 1.1 - 1, 6);
  });

  it("nominal enflasyona eşitse reel getiri ~0", () => {
    expect(realReturn(0.1, 0.1)).toBeCloseTo(0, 6);
  });

  it("nominal enflasyonun altındaysa reel getiri negatif", () => {
    expect(realReturn(0.05, 0.2)).toBeLessThan(0);
  });

  it("makro yoksa enflasyon 0", () => {
    expect(inflationBetween([], 0, 30 * D)).toBe(0);
  });
});
