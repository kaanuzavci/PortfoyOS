import { describe, it, expect } from "vitest";
import { estimateTax, DEFAULT_TAX_RATES } from "../tax";

describe("estimateTax", () => {
  it("fon kazancına oran uygular", () => {
    const r = estimateTax("fon", 1000, 5000);
    expect(r.tax).toBeCloseTo(100); // %10
    expect(r.netIfSold).toBeCloseTo(4900);
  });

  it("zararda vergi yok", () => {
    const r = estimateTax("fon", -500, 4000);
    expect(r.taxableGain).toBe(0);
    expect(r.tax).toBe(0);
    expect(r.netIfSold).toBe(4000);
  });

  it("hisse varsayılan oranı 0", () => {
    expect(DEFAULT_TAX_RATES.hisse).toBe(0);
    expect(estimateTax("hisse", 1000, 5000).tax).toBe(0);
  });
});
