import { describe, it, expect } from "vitest";
import { computeBenchmarks } from "../benchmark";
import type { Transaction, MacroSnapshot } from "@/types";

const D = 86_400_000;

function macro(dayOffset: number, over: Partial<MacroSnapshot>): MacroSnapshot {
  return {
    id: `m${dayOffset}`,
    date: dayOffset * D,
    cpiIndex: 100,
    bist100: 100,
    gramGold: 1000,
    usdTry: 30,
    depositRateAnnual: 0,
    ...over,
  };
}

describe("computeBenchmarks", () => {
  it("BIST iki katına çıkarsa benchmark getirisi ~%100", () => {
    const txs: Transaction[] = [
      { id: "t", assetId: "a", side: "buy", date: 0, units: 10, pricePerUnit: 100, createdAt: 0 },
    ];
    const m = [macro(0, { bist100: 100 }), macro(365, { bist100: 200 })];
    const res = computeBenchmarks(txs, m, 365 * D);
    const bist = res.find((r) => r.key === "bist100")!;
    expect(bist.returnPct).toBeCloseTo(1.0, 2);
  });

  it("mevduat yıllık faizle büyür", () => {
    const txs: Transaction[] = [
      { id: "t", assetId: "a", side: "buy", date: 0, units: 1, pricePerUnit: 1000, createdAt: 0 },
    ];
    const m = [macro(0, { depositRateAnnual: 0.5 })];
    const res = computeBenchmarks(txs, m, 365 * D);
    const dep = res.find((r) => r.key === "deposit")!;
    expect(dep.returnPct).toBeCloseTo(0.5, 2);
  });

  it("dört benchmark döndürür", () => {
    const txs: Transaction[] = [
      { id: "t", assetId: "a", side: "buy", date: 0, units: 1, pricePerUnit: 1000, createdAt: 0 },
    ];
    const res = computeBenchmarks(txs, [macro(0, {})], 30 * D);
    expect(res.map((r) => r.key).sort()).toEqual(
      ["bist100", "deposit", "gramGold", "usd"].sort(),
    );
  });
});
