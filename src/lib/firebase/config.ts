// Firebase istemci kurulumu — env değişkenleri varsa başlatır, yoksa null döner.
// Public repo: Web config client'a açıktır (gizli DEĞİL); koruma Firestore
// Rules + App Check iledir. Üçüncü taraf API anahtarları ASLA buraya girmez.
import { getApps, getApp, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";
import type { AppCheck } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Firebase env'i tam olarak ayarlı mı? Değilse uygulama yerel veri modunda çalışır. */
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.authDomain,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  // ignoreUndefinedProperties: domain modellerindeki opsiyonel (undefined) alanlar
  // Firestore yazımında hata vermesin diye.
  dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
}

export const firebaseApp = app;
export const auth = authInstance;
export const db = dbInstance;

// App Check — sahte istemcileri (Firebase + /api) engeller. Yalnızca tarayıcıda
// ve reCAPTCHA site anahtarı tanımlıysa başlatılır; aksi halde sessizce atlanır
// (kurulmadan önce uygulama çalışmaya devam eder). Konsolda enforcement açılınca
// asıl koruma devreye girer. Yerel test için DEBUG token desteklenir.
export const appCheckReady: Promise<AppCheck | null> = (async () => {
  if (!app || typeof window === "undefined") return null;
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_KEY;
  if (!siteKey) return null;
  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
    const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
    if (debugToken) {
      (globalThis as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }
    return initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    return null;
  }
})();
