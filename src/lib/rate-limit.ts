// Basit, bağımlılıksız hız sınırlayıcı (IP başına, bellek içi).
// Not: Vercel serverless'te her örnek kendi belleğini tutar; bu yüzden bu
// "best-effort" bir koruma katmanıdır. Asıl koruma token doğrulamasıdır.
// Küresel/kalıcı sınır gerekiyorsa Upstash Redis gibi paylaşımlı bir depo eklenir.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastPrune = 0;

function prune(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
}

export interface RateResult {
  ok: boolean;
  retryAfter: number; // saniye
}

/** key (ör. IP) için pencere başına en fazla `max` istek. */
export function rateLimit(key: string, max = 30, windowMs = 60_000): RateResult {
  const now = Date.now();
  prune(now);
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > max) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}
