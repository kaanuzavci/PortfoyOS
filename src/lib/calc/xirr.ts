// XIRR — düzensiz nakit akışları için yıllıklandırılmış iç verim (DCA'nın doğru metriği).
// Newton-Raphson; yakınsamazsa bisection'a düşer. SAF.

export interface CashFlow {
  /** epoch ms */
  date: number;
  /** Negatif = para çıkışı (alış), Pozitif = para girişi (satış / güncel değer) */
  amount: number;
}

const DAY = 86_400_000;

function npv(rate: number, flows: CashFlow[], t0: number): number {
  let sum = 0;
  for (const f of flows) {
    const years = (f.date - t0) / (365 * DAY);
    sum += f.amount / Math.pow(1 + rate, years);
  }
  return sum;
}

function dNpv(rate: number, flows: CashFlow[], t0: number): number {
  let sum = 0;
  for (const f of flows) {
    const years = (f.date - t0) / (365 * DAY);
    sum += (-years * f.amount) / Math.pow(1 + rate, years + 1);
  }
  return sum;
}

/**
 * Nakit akışlarından yıllık iç verimi (XIRR) döndürür. En az bir negatif ve bir
 * pozitif akış gerekir; aksi halde null. Sonuç kesir (0.32 = %32) olarak döner.
 */
export function xirr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;
  const hasPos = flows.some((f) => f.amount > 0);
  const hasNeg = flows.some((f) => f.amount < 0);
  if (!hasPos || !hasNeg) return null;

  const sorted = [...flows].sort((a, b) => a.date - b.date);
  const t0 = sorted[0].date;

  // Newton-Raphson
  let rate = 0.1;
  for (let i = 0; i < 80; i++) {
    const f = npv(rate, sorted, t0);
    const df = dNpv(rate, sorted, t0);
    if (Math.abs(df) < 1e-10) break;
    const next = rate - f / df;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-7) return clampRate(next);
    rate = next;
  }

  // Bisection yedeği
  let lo = -0.9999;
  let hi = 100;
  let flo = npv(lo, sorted, t0);
  let fhi = npv(hi, sorted, t0);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = npv(mid, sorted, t0);
    if (Math.abs(fmid) < 1e-6) return clampRate(mid);
    if (flo * fmid < 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }
  return clampRate((lo + hi) / 2);
}

function clampRate(r: number): number | null {
  if (!Number.isFinite(r)) return null;
  if (r < -0.9999) return -0.9999;
  return r;
}
