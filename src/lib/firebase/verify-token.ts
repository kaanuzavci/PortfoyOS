// Sunucu tarafı Firebase token doğrulama — YALNIZCA Route Handler'da kullanılır.
// firebase-admin / servis hesabı GEREKTİRMEZ: Google'ın PUBLIC anahtarlarıyla
// doğrular. Böylece sunucuda yüksek yetkili yeni bir sır (servis hesabı özel
// anahtarı) tutmak zorunda kalmayız — sızıntı yüzeyi küçük kalır.
import { importX509, jwtVerify, createRemoteJWKSet, decodeProtectedHeader } from "jose";

// ── Firebase ID token (kullanıcı kimliği) ───────────────────────────────────
// ID token'lar securetoken hizmetinin x509 sertifikalarıyla (RS256) imzalanır.
const ID_CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache: { certs: Record<string, string>; exp: number } | null = null;

async function getIdCerts(): Promise<Record<string, string>> {
  if (certCache && Date.now() < certCache.exp) return certCache.certs;
  const res = await fetch(ID_CERT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`cert fetch ${res.status}`);
  const certs = (await res.json()) as Record<string, string>;
  const cc = res.headers.get("cache-control") ?? "";
  const m = /max-age=(\d+)/.exec(cc);
  const ttl = m ? Number(m[1]) * 1000 : 60 * 60 * 1000;
  certCache = { certs, exp: Date.now() + ttl };
  return certs;
}

export interface VerifiedUser {
  uid: string;
  email?: string;
}

/** Firebase ID token'ını doğrular; geçersizse hata fırlatır. */
export async function verifyIdToken(
  token: string,
  projectId: string,
): Promise<VerifiedUser> {
  const { kid } = decodeProtectedHeader(token);
  if (!kid) throw new Error("kid yok");
  const certs = await getIdCerts();
  const pem = certs[kid];
  if (!pem) throw new Error("bilinmeyen kid");
  const key = await importX509(pem, "RS256");
  const { payload } = await jwtVerify(token, key, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  if (!payload.sub) throw new Error("sub yok");
  return { uid: payload.sub, email: payload.email as string | undefined };
}

// ── App Check token (uygulama bütünlüğü) ────────────────────────────────────
// App Check token'ları için resmi JWKS uç noktası vardır (RS256).
const appCheckJwks = createRemoteJWKSet(
  new URL("https://firebaseappcheck.googleapis.com/v1/jwks"),
);

/** App Check token'ını doğrular; geçersizse hata fırlatır. projectNumber = messagingSenderId. */
export async function verifyAppCheckToken(
  token: string,
  projectNumber: string,
): Promise<void> {
  await jwtVerify(token, appCheckJwks, {
    issuer: `https://firebaseappcheck.googleapis.com/${projectNumber}`,
    audience: `projects/${projectNumber}`,
  });
}
