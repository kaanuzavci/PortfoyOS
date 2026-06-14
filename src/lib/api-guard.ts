// /api/* için sunucu tarafı kapı bekçisi: origin kontrolü + hız sınırı +
// Firebase ID token (ve varsa App Check) doğrulaması. Yalnızca sunucuda çalışır.
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { verifyIdToken, verifyAppCheckToken } from "@/lib/firebase/verify-token";

// NEXT_PUBLIC_* değişkenleri sunucuda da process.env üzerinden okunabilir.
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const PROJECT_NUMBER = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "";
// App Check zorunluluğunu kademeli açmak için: token yoksa REDdet. Konsolda
// App Check kurulup test edilince APPCHECK_ENFORCE=true yapılır.
const APPCHECK_ENFORCE = process.env.APPCHECK_ENFORCE === "true";

type GuardResult = { ok: true } | { ok: false; response: NextResponse };

function deny(message: string, status: number, extraHeaders?: HeadersInit): GuardResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status, headers: extraHeaders }),
  };
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Aynı-origin mi? Tarayıcı isteklerinde Origin başlığı host ile eşleşmeli. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // tarayıcı-dışı (curl vs.) — token kontrolüne bırak
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * İsteği doğrular. Firebase yapılandırılmışsa (canlı/prod) geçerli bir ID token
 * şarttır. Yapılandırılmamışsa (yerel demo) token aranmaz; yalnızca origin+limit.
 */
export async function guardApiRequest(
  req: Request,
  { maxPerMinute = 30 }: { maxPerMinute?: number } = {},
): Promise<GuardResult> {
  // 1) Hız sınırı (best-effort, IP başına).
  const rl = rateLimit(`api:${clientIp(req)}`, maxPerMinute);
  if (!rl.ok) {
    return deny("Çok fazla istek", 429, { "Retry-After": String(rl.retryAfter) });
  }

  // 2) Origin (CSRF / siteler-arası kötüye kullanım).
  if (!sameOrigin(req)) return deny("Geçersiz kaynak", 403);

  // 3) Firebase yapılandırılmamışsa (yerel demo) burada dur.
  if (!PROJECT_ID) return { ok: true };

  // 4) Firebase ID token zorunlu.
  const authz = req.headers.get("authorization") ?? "";
  const idToken = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (!idToken) return deny("Kimlik doğrulaması gerekli", 401);
  try {
    await verifyIdToken(idToken, PROJECT_ID);
  } catch {
    return deny("Geçersiz oturum", 401);
  }

  // 5) App Check (varsa doğrula; zorunluysa eksikse reddet).
  const acToken = req.headers.get("x-firebase-appcheck") ?? "";
  if (acToken) {
    if (!PROJECT_NUMBER) return deny("App Check yapılandırması eksik", 500);
    try {
      await verifyAppCheckToken(acToken, PROJECT_NUMBER);
    } catch {
      return deny("Geçersiz App Check", 401);
    }
  } else if (APPCHECK_ENFORCE) {
    return deny("App Check gerekli", 401);
  }

  return { ok: true };
}
