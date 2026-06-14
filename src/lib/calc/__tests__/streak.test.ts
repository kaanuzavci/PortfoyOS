import { describe, it, expect } from "vitest";
import { detectStreak, levelForLength, PROFIT_LEVELS, LOSS_LEVELS } from "../streak";

describe("detectStreak", () => {
  it("artan seriyi yükseliş olarak sayar", () => {
    const r = detectStreak([1, 2, 3, 4]);
    expect(r.direction).toBe("up");
    expect(r.length).toBe(3);
    expect(r.level?.name).toBe("Kıvılcım");
  });

  it("azalan seriyi düşüş olarak sayar", () => {
    const r = detectStreak([5, 4, 3, 2, 1]);
    expect(r.direction).toBe("down");
    expect(r.length).toBe(4);
    expect(r.level?.name).toBe("Dikkat");
  });

  it("yön değişince seri kırılır (son adımdan sayar)", () => {
    const r = detectStreak([1, 2, 3, 2]);
    expect(r.direction).toBe("down");
    expect(r.length).toBe(1);
    expect(r.level).toBeNull();
  });

  it("uzun yükseliş üst seviyeye ulaşır", () => {
    const up = Array.from({ length: 22 }, (_, i) => i + 1);
    const r = detectStreak(up);
    expect(r.direction).toBe("up");
    expect(r.length).toBe(21);
    expect(r.level?.name).toBe("Zirve");
    expect(r.nextLevel).toBeNull();
  });

  it("yetersiz veri none döner", () => {
    expect(detectStreak([1]).direction).toBe("none");
    expect(detectStreak([]).direction).toBe("none");
  });

  it("levelForLength eşik mantığı", () => {
    expect(levelForLength(2, PROFIT_LEVELS)).toBeNull();
    expect(levelForLength(3, PROFIT_LEVELS)?.name).toBe("Kıvılcım");
    expect(levelForLength(13, PROFIT_LEVELS)?.name).toBe("Roket");
    expect(levelForLength(8, LOSS_LEVELS)?.name).toBe("Tehlike");
  });
});
