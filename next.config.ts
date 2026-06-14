import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Güvenlik başlıkları (Next.js 16, headers() — proxy/nonce gerektirmez; statik
// render korunur). Canlı uygulamayı kırmamak için Firebase Auth, Firestore,
// Google ile giriş ve reCAPTCHA (App Check) domain'leri açıkça izinli.
//
// Not: Nonce tabanlı katı bir CSP, tüm sayfaları dinamik render'a zorlardı; bu
// uygulamada XSS sink'i (dangerouslySetInnerHTML/eval) olmadığından, script/style
// için 'unsafe-inline' ile pragmatik ama anlamlı bir CSP tercih edildi.
// ─────────────────────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === "development";

// Firebase/Google uç noktaları (Auth, Firestore, App Check, profil fotoğrafı).
const GOOGLE_API = "https://*.googleapis.com";
const FIREBASE_HOSTS =
  "https://*.firebaseapp.com https://*.web.app https://apis.google.com";
const GOOGLE_AUTH = "https://accounts.google.com https://*.google.com";
const RECAPTCHA = "https://www.google.com https://www.gstatic.com";

const csp = [
  `default-src 'self'`,
  // Next.js hydration + reCAPTCHA/Google scriptleri. (dev'de React eval kullanır.)
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${RECAPTCHA} ${FIREBASE_HOSTS}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https://*.googleusercontent.com https://www.gstatic.com https://www.google.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  // Firebase Auth/Firestore (REST + websocket) + App Check.
  `connect-src 'self' ${GOOGLE_API} https://*.firebaseio.com wss://*.firebaseio.com https://firebaseinstallations.googleapis.com ${GOOGLE_AUTH} ${RECAPTCHA}`,
  // Google ile giriş popup/iframe + reCAPTCHA iframe.
  `frame-src 'self' ${FIREBASE_HOSTS} ${GOOGLE_AUTH} ${RECAPTCHA}`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Clickjacking — CSP frame-ancestors'ın eski tarayıcı karşılığı.
  { key: "X-Frame-Options", value: "DENY" },
  // MIME sniffing kapalı.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer sızıntısını azalt.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Gereksiz tarayıcı API'lerini kapat.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // 2 yıl HTTPS zorunlu (yalnızca HTTPS'te etki eder; Vercel HTTPS sunar).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Sunucu yazılımı parmak izini gizle.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
