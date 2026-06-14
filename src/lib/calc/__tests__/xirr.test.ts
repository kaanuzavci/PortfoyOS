import { describe, it, expect } from "vitest";
import { xirr } from "../xirr";

const D = 86_400_000;
const YEAR = 365 * D;

describe("xirr", () => {
  it("bir yılda iki katına çıkan yatırım ~%100 verir", () => {
    const r = xirr([
      { date: 0, amount: -1000 },
      { date: YEAR, amount: 2000 },
    ]);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(1.0, 2);
  });

  it("bir yılda %10 getiri ~0.10 verir", () => {
    const r = xirr([
      { date: 0, amount: -1000 },
      { date: YEAR, amount: 1100 },
    ]);
    expect(r!).toBeCloseTo(0.1, 2);
  });

  it("düzensiz akışlarda makul bir oran döndürür", () => {
    const r = xirr([
      { date: 0, amount: -1000 },
      { date: 180 * D, amount: -500 },
      { date: YEAR, amount: 1700 },
    ]);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(0);
    expect(r!).toBeLessThan(1);
  });

  it("zarar negatif oran verir", () => {
    const r = xirr([
      { date: 0, amount: -1000 },
      { date: YEAR, amount: 800 },
    ]);
    expect(r!).toBeCloseTo(-0.2, 2);
  });

  it("yetersiz akış null döner", () => {
    expect(xirr([{ date: 0, amount: -1000 }])).toBeNull();
    expect(
      xirr([
        { date: 0, amount: -1000 },
        { date: YEAR, amount: -500 },
      ]),
    ).toBeNull();
  });
});
