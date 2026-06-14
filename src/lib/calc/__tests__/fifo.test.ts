import { describe, it, expect } from "vitest";
import { computePosition } from "../position";
import type { Transaction, PriceSnapshot } from "@/types";

const D = 86_400_000;
let seq = 0;
function buy(units: number, price: number, day: number, fee = 0): Transaction {
  return { id: `b${seq++}`, assetId: "x", side: "buy", date: day * D, units, pricePerUnit: price, fee, createdAt: day * D };
}
function sell(units: number, price: number, day: number, fee = 0): Transaction {
  return { id: `s${seq++}`, assetId: "x", side: "sell", date: day * D, units, pricePerUnit: price, fee, createdAt: day * D };
}
function snap(price: number, day = 10): PriceSnapshot {
  return { id: `p${seq++}`, assetId: "x", date: day * D, price, source: "test" };
}

describe("FIFO vs ağırlıklı ortalama", () => {
  const txs = [buy(100, 10, 0), buy(100, 20, 1), sell(150, 30, 2)];
  const snaps = [snap(30)];

  it("FIFO: en eski lotlar önce satılır", () => {
    const pos = computePosition("x", txs, snaps, undefined, "fifo");
    // 100@10 (kâr 2000) + 50@20 (kâr 500) = 2500 gerçekleşen
    expect(pos.realizedPnl).toBeCloseTo(2500);
    expect(pos.heldUnits).toBe(50);
    expect(pos.avgCost).toBeCloseTo(20); // kalan 50 adet ikinci lottan
    expect(pos.costBasis).toBeCloseTo(1000);
  });

  it("ağırlıklı ortalama farklı gerçekleşen K/Z verir", () => {
    const pos = computePosition("x", txs, snaps, undefined, "average");
    // ort 15; sat 150@30 → (30-15)*150 = 2250
    expect(pos.realizedPnl).toBeCloseTo(2250);
    expect(pos.heldUnits).toBe(50);
    expect(pos.avgCost).toBeCloseTo(15);
  });

  it("FIFO tek lot tek satışta ortalama ile aynı", () => {
    const t = [buy(100, 10, 0), sell(40, 15, 1)];
    const a = computePosition("x", t, [snap(15)], undefined, "average");
    const f = computePosition("x", t, [snap(15)], undefined, "fifo");
    expect(f.realizedPnl).toBeCloseTo(a.realizedPnl);
    expect(f.heldUnits).toBe(a.heldUnits);
  });

  it("FIFO alış masrafını lota ekler", () => {
    const t = [buy(100, 10, 0, 100), sell(100, 10, 1)];
    const f = computePosition("x", t, [snap(10)], undefined, "fifo");
    // maliyet 10.10/adet → 100 adet satış 1000 hasılat - 1010 maliyet = -100 (+ masrafsız satış)
    expect(f.realizedPnl).toBeCloseTo(-100);
    expect(f.heldUnits).toBe(0);
  });
});
