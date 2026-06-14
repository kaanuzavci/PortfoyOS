# PortföyOS — Kurulum & Yayına Alma Rehberi

Bu rehber, uygulamayı **buluta bağlayıp (Firebase)** internete **yayınlamak (Vercel)**
için gereken adımları sırasıyla anlatır. Kod tarafında her şey hazır; aşağıdaki
adımlar yalnızca senin hesaplarında yapılacak konsol işlemleridir (~15 dk).

> Hiçbir gizli anahtar repoya girmez. Firebase web config'i client'a açıktır
> (gizli değildir); güvenlik Firestore kuralları ile sağlanır.

---

## 1) Firebase projesi oluştur (~4 dk)

1. https://console.firebase.google.com → **Proje ekle** → ad: `portfoyos` → oluştur.
   (Google Analytics istersen kapat, gerek yok.)
2. Sol menüde **Build → Authentication → Get started**.
   - **Sign-in method** sekmesi → **Email/Password** → Enable → Save.
   - (İstersen) **Google** → Enable → Save.
3. Sol menüde **Build → Firestore Database → Create database**.
   - **Production mode** seç → konum: **eur3 (europe-west3)** → Enable.
4. Firestore açılınca **Rules** sekmesine geç, içeriği tamamen sil ve bu repodaki
   [`firestore.rules`](firestore.rules) dosyasının içeriğini yapıştır → **Publish**.
   (Bu kural, her kullanıcının yalnızca kendi verisine erişmesini sağlar.)

## 2) Web uygulaması config'ini al (~2 dk)

1. Firebase Console → **Project settings** (⚙️ dişli) → **General** sekmesi.
2. Aşağı in → **Your apps** → **</> (Web)** simgesine tıkla → app adı `portfoyos-web`
   → **Register app**.
3. Çıkan `firebaseConfig` nesnesindeki değerleri not al:
   `apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId`.

## 3) Vercel'e yayınla (~6 dk)

1. https://vercel.com → GitHub ile giriş yap → **Add New… → Project**.
2. `kaanuzavci/PortfoyOS` reposunu **Import** et.
   - **Production Branch**'i `main` bırak (proje `main`'e v1.0.0 olarak birleştirildi).
3. **Environment Variables** bölümüne adım 2'deki değerleri ekle:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | apiKey |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | storageBucket |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | appId |
   | `NEXT_PUBLIC_SITE_URL` | (deploy sonrası verilen adres, ör. `https://portfoyos.vercel.app`) |

4. **Deploy**'a bas. Birkaç dakikada adresin hazır olur.
5. Firebase Console → **Authentication → Settings → Authorized domains**'e Vercel
   adresini (`...vercel.app`) ekle (Google ile giriş için gerekir).

> Not: `NEXT_PUBLIC_*` değişkenleri **derleme anında** gömülür. Değişkenleri
> ekledikten sonra deploy etmelisin (sonradan eklersen yeniden deploy gerekir).

## 4) Test et

1. Yayınlanan adrese gir → e-posta/şifre ile **kayıt ol**.
2. **"Demo verisi yükle"** veya kendi varlıklarını ekle.
3. Başka bir cihaz/tarayıcıdan aynı hesapla gir → **verilerin senkron** geldiğini gör.
4. **"Fiyatları güncelle"** ile hisse/döviz/kripto/altın güncel fiyatlarını çek.

---

## Yerel geliştirme (opsiyonel)

`.env.local.example` → `.env.local` olarak kopyala, aynı Firebase değerlerini doldur,
`npm run dev`. Firebase doldurulmazsa uygulama otomatik **yerel demo modunda** çalışır.

## Firestore kurallarını CLI ile yaymak (opsiyonel)

```bash
npm i -g firebase-tools
firebase login
firebase use --add        # projeni seç
firebase deploy --only firestore:rules
```

## Bilinen kısıt
- Otomatik fiyat: hisse (BIST), döviz (TCMB), kripto, altın çalışır. **Fon (TEFAS)**
  kaynağı şu an anonim erişime kapalı olduğundan fon fiyatları **manuel** girilir
  (Admin → Fiyatlar). Diğerleri otomatik.
