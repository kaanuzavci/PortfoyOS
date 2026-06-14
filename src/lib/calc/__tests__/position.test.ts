import { describe, it, expect } from "vitest";
import { computePosition } from "../position";
import type { Transaction, PriceSnapshot } from "@/types";

const D = 86_400_000;
let seq = 0;
function buy(assetId: string, units: number, price: number, dayOffset = 0, fee = 0): Transaction {
  return {
    id: `b${seq++}`,
    assetId,
    side: "buy",
    date: dayOffset * D,
    units,
    pricePerUnit: price,
    fee,
    createdAt: dayOffset * D,
  };
}
function sell(assetId: string, units: number, price: number, dayOffset = 0, fee = 0): Transaction {
  return {
    id: `s${seq++}`,
    assetId,
    side: "sell",
    date: dayOffset * D,
    units,
    pricePerUnit: price,
    fee,
    createdAt: dayOffset * D,
  };
}
function snap(assetId: string, price: number, dayOffset = 10): PriceSnapshot {
  return { id: `p${seq++}`, assetId, date: dayOffset * D, price, source: "test" };
}

describe("computePosition — ağırlıklı ortalama maliyet", () => {
  it("tek alış + fiyat artışı doğru K/Z verir", () => {
    const pos = computePosition("x", [buy("x", 100, 10, 0)], [snap("x", 12)]);
    expect(pos.heldUnits).toBe(100);
    expect(pos.avgCost).toBeCloseTo(10);
    expect(pos.costBasis).toBeCloseTo(1000);
    expect(pos.currentValue).toBeCloseTo(1200);
    expect(pos.unrealizedPnl).toBeCloseTo(200);
    expect(pos.unrealizedPnlPct).toBeCloseTo(0.2);
  });

  it("iki farklı fiyattan alış ağırlıklı ortalamayı hesaplar", () => {
    const pos = computePosition(
      "x",
      [buy("x", 100, 10, 0), buy("x", 100, 20, 1)],
      [snap("x", 20)],
    );
    expect(pos.heldUnits).toBe(200);
    expect(pos.avgCost).toBeCloseTo(15);
    expect(pos.costBasis).toBeCloseTo(3000);
  });

  it("kısmi satış gerçekleşmiş K/Z üretir, ortalama maliyet değişmez", () => {
    const pos = computePosition(
      "x",
      [buy("x", 100, 10, 0), sell("x", 50, 20, 1)],
      [snap("x", 20)],
    );
    expect(pos.heldUnits).toBe(50);
    expect(pos.avgCost).toBeCloseTo(10);
    expect(pos.realizedPnl).toBeCloseTo(500); // 50*20 - 50*10
    expect(pos.unrealizedPnl).toBeCloseTo(500); // (20-10)*50
    expect(pos.totalPnl).toBeCloseTo(1000);
  });

  it("alış masrafı maliyet bazına eklenir", () => {
    const pos = computePosition("x", [buy("x", 100, 10, 0, 5)], [snap("x", 10)]);
    expect(pos.costBasis).toBeCloseTo(1005);
    expect(pos.avgCost).toBeCloseTo(10.05);
    expect(pos.unrealizedPnl).toBeCloseTo(-5);
  });

  it("satış masrafı hasılattan düşülür", () => {
    const pos = computePosition(
      "x",
      [buy("x", 100, 10, 0), sell("x", 100, 20, 1, 10)],
      [snap("x", 20)],
    );
    expect(pos.heldUnits).toBe(0);
    expect(pos.realizedPnl).toBeCloseTo(990); // 100*20 - 10 - 100*10
  });

  it("fxRate ile TRY dışı işlem dönüştürülür", () => {
    const tx: Transaction = {
      id: "fx",
      assetId: "u",
      side: "buy",
      date: 0,
      units: 100,
      pricePerUnit: 2, // 2 USD
      fxRate: 30, // 1 USD = 30 TRY
      createdAt: 0,
    };
    const s: PriceSnapshot = {
      id: "ps",
      assetId: "u",
      date: D,
      price: 2.5,
      fxRateToTRY: 32,
      source: "test",
    };
    const pos = computePosition("u", [tx], [s]);
    expect(pos.avgCost).toBeCloseTo(60); // 2 * 30
    expect(pos.latestPrice).toBeCloseTo(80); // 2.5 * 32
    expect(pos.unrealizedPnl).toBeCloseTo((80 - 60) * 100);
  });
});
