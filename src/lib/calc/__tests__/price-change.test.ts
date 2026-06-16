import { describe, it, expect } from "vitest";
import { priceChangePct } from "../price-change";
import type { PriceSnapshot } from "@/types";

const DAY = 86_400_000;
const now = Date.UTC(2026, 5, 17);

function snap(assetId: string, price: number, dayAgo: number): PriceSnapshot {
  return { id: `${assetId}-${dayAgo}`, assetId, date: now - dayAgo * DAY, price, source: "test" };
}

describe("priceChangePct", () => {
  it("7 gün önceki fiyata göre artışı hesaplar", () => {
    const snaps = [snap("x", 100, 10), snap("x", 100, 7), snap("x", 110, 0)];
    const r = priceChangePct(snaps, "x", 7, now);
    expect(r.changePct).toBeCloseTo(0.1);
    expect(r.current).toBe(110);
    expect(r.past).toBe(100);
    expect(r.hasData).toBe(true);
  });

  it("düşüş negatif döner", () => {
    const snaps = [snap("x", 200, 8), snap("x", 180, 0)];
    expect(priceChangePct(snaps, "x", 7, now).changePct).toBeCloseTo(-0.1);
  });

  it("yeterli geçmiş yoksa hasData=false", () => {
    const snaps = [snap("x", 100, 0)]; // sadece bugün
    expect(priceChangePct(snaps, "x", 7, now).hasData).toBe(false);
  });

  it("veri yoksa sıfır + hasData false", () => {
    const r = priceChangePct([], "x", 7, now);
    expect(r.hasData).toBe(false);
    expect(r.changePct).toBe(0);
  });
});
