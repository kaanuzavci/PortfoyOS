import { describe, it, expect } from "vitest";
import {
  portfolioValueSeries,
  periodReturn,
  periodStart,
  valueAt,
} from "../timeseries";
import type { Asset, Transaction, PriceSnapshot } from "@/types";

const D = 86_400_000;

const asset: Asset = {
  id: "a",
  name: "Test",
  type: "hisse",
  currency: "TRY",
  isArchived: false,
  createdAt: 0,
  updatedAt: 0,
};

function tx(units: number, price: number, day: number): Transaction {
  return {
    id: `t${day}`,
    assetId: "a",
    side: "buy",
    date: day * D,
    units,
    pricePerUnit: price,
    createdAt: day * D,
  };
}
function snap(price: number, day: number): PriceSnapshot {
  return { id: `p${day}`, assetId: "a", date: day * D, price, source: "test" };
}

describe("portfolioValueSeries", () => {
  it("değer serisi alış sonrası fiyatla büyür", () => {
    const series = portfolioValueSeries(
      [asset],
      [tx(100, 10, 0)],
      [snap(10, 0), snap(11, 1), snap(12, 2)],
    );
    expect(series.length).toBe(3);
    expect(series[0].value).toBeCloseTo(1000);
    expect(series[2].value).toBeCloseTo(1200);
    expect(series[2].costBasis).toBeCloseTo(1000);
    expect(series[2].pnl).toBeCloseTo(200);
  });

  it("varlık yoksa boş seri", () => {
    expect(portfolioValueSeries([], [], [])).toEqual([]);
  });
});

describe("periodReturn", () => {
  it("net yatırım olmadan getiri farkı doğru", () => {
    const series = portfolioValueSeries(
      [asset],
      [tx(100, 10, 0)],
      [snap(10, 0), snap(10, 5), snap(12, 10)],
    );
    const now = 10 * D;
    const start = 5 * D;
    const r = periodReturn(series, [tx(100, 10, 0)], start, now);
    expect(r.startValue).toBeCloseTo(1000);
    expect(r.endValue).toBeCloseTo(1200);
    expect(r.netFlow).toBeCloseTo(0);
    expect(r.gain).toBeCloseTo(200);
    expect(r.pct).toBeCloseTo(0.2);
  });
});

describe("periodStart & valueAt", () => {
  it("periodStart dönemleri doğru hesaplar", () => {
    const now = 100 * D;
    expect(periodStart("1G", now)).toBe(99 * D);
    expect(periodStart("1H", now)).toBe(93 * D);
    expect(periodStart("1A", now)).toBe(70 * D);
  });

  it("valueAt en yakın <= noktayı verir", () => {
    const series = [
      { date: 0, value: 100, costBasis: 0, invested: 0, pnl: 0 },
      { date: 5 * D, value: 150, costBasis: 0, invested: 0, pnl: 0 },
      { date: 10 * D, value: 200, costBasis: 0, invested: 0, pnl: 0 },
    ];
    expect(valueAt(series, 7 * D)).toBe(150);
    expect(valueAt(series, 10 * D)).toBe(200);
  });
});
