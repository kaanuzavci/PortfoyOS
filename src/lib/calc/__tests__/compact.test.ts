import { describe, it, expect } from "vitest";
import { compactSnapshots } from "../compact";
import type { PriceSnapshot } from "@/types";

const DAY = 86_400_000;
const now = Date.UTC(2026, 5, 14);

function gen(assetId: string, days: number): PriceSnapshot[] {
  const out: PriceSnapshot[] = [];
  for (let i = 0; i < days; i++) {
    const date = now - i * DAY;
    out.push({ id: `${assetId}-${i}`, assetId, date, price: 100 + i, source: "test" });
  }
  return out;
}

describe("compactSnapshots", () => {
  it("son ~13 ay günlük korunur, eskisi seyrekleşir", () => {
    const snaps = gen("x", 1000); // ~2.7 yıl günlük
    const out = compactSnapshots(snaps, now);
    expect(out.length).toBeLessThan(snaps.length);
    // Son 400 gün günlük → en az ~400 kayıt
    const recent = out.filter((s) => now - s.date < 400 * DAY);
    expect(recent.length).toBe(400);
  });

  it("en güncel kayıt her zaman korunur", () => {
    const snaps = gen("x", 1500);
    const out = compactSnapshots(snaps, now);
    const newest = out.reduce((a, b) => (a.date >= b.date ? a : b));
    expect(now - newest.date).toBeLessThan(DAY);
  });

  it("idempotent — iki kez çalıştırınca değişmez", () => {
    const once = compactSnapshots(gen("x", 1200), now);
    const twice = compactSnapshots(once, now);
    expect(twice.length).toBe(once.length);
  });

  it("çok varlık karışmaz", () => {
    const snaps = [...gen("x", 800), ...gen("y", 800)];
    const out = compactSnapshots(snaps, now);
    expect(out.some((s) => s.assetId === "x")).toBe(true);
    expect(out.some((s) => s.assetId === "y")).toBe(true);
  });

  it("küçük veri olduğu gibi kalır", () => {
    const snaps = gen("x", 30);
    expect(compactSnapshots(snaps, now).length).toBe(30);
  });
});
