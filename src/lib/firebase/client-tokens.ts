// İstemci tarafı token yardımcıları — /api çağrılarına Authorization (Firebase
// ID token) ve X-Firebase-AppCheck başlıklarını eklemek için. Token yoksa null
// döner (yerel demo modu / App Check kurulmamış durumda istek yine de çalışır).
import { auth, appCheckReady } from "./config";

/** Giriş yapmış kullanıcının güncel ID token'ı (yoksa null). */
export async function getIdTokenSafe(): Promise<string | null> {
  const user = auth?.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/** App Check token'ı (App Check yapılandırılmamışsa null). */
export async function getAppCheckTokenSafe(): Promise<string | null> {
  try {
    const ac = await appCheckReady;
    if (!ac) return null;
    const { getToken } = await import("firebase/app-check");
    const res = await getToken(ac, /* forceRefresh */ false);
    return res.token;
  } catch {
    return null;
  }
}

/** /api isteklerinde kullanılacak güvenlik başlıkları. */
export async function authHeaders(): Promise<Record<string, string>> {
  const [idToken, appCheckToken] = await Promise.all([
    getIdTokenSafe(),
    getAppCheckTokenSafe(),
  ]);
  const headers: Record<string, string> = {};
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
  if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;
  return headers;
}
