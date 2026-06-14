# PortföyOS — Güvenlik Rehberi & Konsol Kontrol Listesi

Bu dosya iki kısımdan oluşur:
1. **Kodda alınan önlemler** (zaten uygulandı — bilgi amaçlı).
2. **Senin yapman gerekenler** (Firebase/Google/Vercel konsollarında; kod bunu yapamaz).

> Tehdit modeli: Depo **public**, frontend JS tarayıcıda görünür. Bu yüzden gizli
> hiçbir değer client'a / repoya konmaz; koruma **Firestore Rules + App Check +
> sunucu tarafı token doğrulaması** ile sağlanır. Veriler kullanıcı bazında izole.

---

## 1) Kodda alınan önlemler ✅

| Önlem | Dosya |
|---|---|
| Güvenlik HTTP başlıkları (CSP, HSTS, X-Frame-Options: DENY, nosniff, Referrer-Policy, Permissions-Policy) + `poweredByHeader` kapalı | [next.config.ts](next.config.ts) |
| Firestore: tek yola kilitli, sahibi-dışı erişim yok, yazımda boyut/şekil doğrulaması | [firestore.rules](firestore.rules) |
| `/api/prices`: origin kontrolü + IP başına hız sınırı + Firebase ID token doğrulaması (+ App Check) | [src/lib/api-guard.ts](src/lib/api-guard.ts), [src/app/api/prices/route.ts](src/app/api/prices/route.ts) |
| Token doğrulama Google'ın **public** anahtarlarıyla — servis hesabı sırrı yok | [src/lib/firebase/verify-token.ts](src/lib/firebase/verify-token.ts) |
| App Check istemci kurulumu (reCAPTCHA v3) + isteklere token ekleme | [src/lib/firebase/config.ts](src/lib/firebase/config.ts), [src/lib/firebase/client-tokens.ts](src/lib/firebase/client-tokens.ts) |
| `postcss` güvenlik yaması (npm override) | [package.json](package.json) |

---

## 2) Senin yapman gerekenler (konsol) — sırayla

### A) Firebase App Check'i kur (en önemli) — ~10 dk
App Check, **yalnızca senin gerçek uygulamandan** gelen isteklere izin verir; sahte
istemcilerin Firestore/Auth kotanı ve `/api`'yi kötüye kullanmasını engeller.

1. **reCAPTCHA v3 anahtarı al:** https://www.google.com/recaptcha/admin → **+** →
   tür **reCAPTCHA v3**, domain olarak Vercel adresini (`portfoyos.vercel.app`) ve
   `localhost` ekle → **SITE KEY** ve **SECRET KEY**'i not al.
2. **Firebase Console → Build → App Check → Apps** → web uygulamanı seç →
   **reCAPTCHA v3** sağlayıcısını seç → reCAPTCHA **SECRET KEY**'i gir → kaydet.
3. **Vercel → Project → Settings → Environment Variables** ekle:
   - `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_KEY` = reCAPTCHA **SITE KEY**
   - **Redeploy** et (NEXT_PUBLIC değişkenleri derlemede gömülür).
4. **App Check → Apps**'te birkaç saat istek topla, sonra **Enforce**'u aç:
   - **Firestore** için Enforce ✅
   - **Authentication** için Enforce ✅
5. `/api` tarafında da App Check'i zorunlu kılmak için Vercel'e `APPCHECK_ENFORCE=true`
   ekleyip redeploy et. (Önce App Check'in çalıştığını doğrula; erken açarsan
   istekler reddedilir.)

### B) Firebase Auth sertleştirme — ~3 dk
Firebase Console → **Authentication → Settings**:
1. **User actions → Email enumeration protection: Açık** (hesap var/yok sızıntısını engeller).
2. **Password policy:** minimum 8+ karakter, en az bir rakam/harf zorunlu yap.
3. **Authorized domains:** yalnızca kendi domain'lerin kalsın (Vercel adresi + varsa
   özel alan adın). Tanımadığın domain varsa kaldır.
4. (Opsiyonel) Hassas işlemler için **e-posta doğrulaması** isteyebilirsin.

### C) Google Cloud — API anahtarını domain'e kısıtla — ~3 dk
Firebase web API key "gizli değil" ama yine de **kullanım alanını** daraltmak iyidir.
https://console.cloud.google.com/apis/credentials → projeni seç → **Browser key
(auto created by Firebase)**:
1. **Application restrictions → HTTP referrers** → yalnızca kendi domain'lerini ekle:
   `https://portfoyos.vercel.app/*`, (özel alan adın), `http://localhost:3000/*`.
2. **API restrictions →** yalnızca kullandığın API'leri seç (Identity Toolkit,
   Token Service, Firestore, App Check vb.).

> Not: Referrer kısıtlaması istemci tarafı bir önlemdir; asıl koruma App Check + Rules.

### D) Maliyet/istismar koruması — ~3 dk
1. **Firebase Console → Usage and billing → Budgets & alerts**: aylık bütçe + e-posta
   alarmı kur (beklenmedik kullanım = olası istismar sinyali).
2. **Vercel → Settings → (Usage/Spend)**: kullanım uyarılarını aç.

### E) Firestore kurallarını yayınla — ~1 dk
Bu repodaki [firestore.rules](firestore.rules) güncellendi. Yayınla:
- **Console:** Firestore → Rules → içeriği yapıştır → **Publish**, **veya**
- **CLI:** `firebase deploy --only firestore:rules`

### F) Genel hijyen
- **2FA:** GitHub, Vercel ve Google hesaplarında iki adımlı doğrulamayı aç.
- **Sırlar:** Üçüncü taraf gizli anahtarları **asla** `NEXT_PUBLIC_*` yapma ve repoya
  koyma; yalnızca Vercel "Environment Variables" (server-only) içinde tut.
- **Bağımlılık:** Zaman zaman `npm audit` çalıştır; kritik/yüksek açıkları kapat.

---

## Doğrulama (deploy sonrası)
- [ ] Google ile giriş + e-posta/şifre giriş **çalışıyor** (CSP bir şeyi bloklamıyor — tarayıcı konsolunda CSP hatası yok).
- [ ] İki cihazda veri **senkronu** çalışıyor (Firestore + App Check uyumlu).
- [ ] "Fiyatları güncelle" **çalışıyor** (token'lı `/api/prices`).
- [ ] App Check **Enforce** açıkken her şey çalışıyor; `APPCHECK_ENFORCE=true`.
- [ ] Başka bir origin'den `/api/prices`'a token'sız istek **401/403** alıyor.

> CSP bir şeyi yanlışlıkla bloklarsa: [next.config.ts](next.config.ts) içinde ilgili
> domain'i ekle veya geçici olarak `Content-Security-Policy` satırını `...-Report-Only`
> yapıp tarayıcı konsolundaki ihlalleri izle.
