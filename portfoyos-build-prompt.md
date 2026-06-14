# PortföyOS — Kişisel Yatırım Takip Platformu
### Claude Code Yapım + Operasyon Kılavuzu (FINAL)

> Bu doküman Claude Code'un **boş bir `PortfoyOS` klasöründen başlayıp** uygulamayı kurması, geliştirmesi, kurulu tasarım skill'lerini kullanması ve doğru git akışıyla GitHub'a göndermesi için hazırlanmış eksiksiz operasyon kılavuzudur. Türk piyasası odaklıdır (TEFAS fonları, BIST, halka arz, altın, döviz, mevduat). Kişiseldir; çok kullanıcıya genişleyebilir mimaride kurulur.

> **Mevcut durum:** Kullanıcı boş bir `PortfoyOS` klasörü oluşturdu ve Antigravity ile açtı. GitHub deposu **public** olarak hazır: `https://github.com/kaanuzavci/PortfoyOS.git`. Hiçbir kurulum yapılmadı.

---

## 0. Tek Cümlelik Özet

İlk giriş maliyetlerime göre tüm yatırımlarımın anlık kâr/zarar durumunu; günlük/haftalık/aylık/yıllık grafiklerle; en çok kazandıran–kaybettiren analizleriyle; kâr ve zarar **serisi** seviyelerine göre bildirim ve uyarılarla takip ettiğim; yeni yatırımları kolayca eklediğim bir **admin paneli** içeren, koyu temalı, modern, veri-yoğun bir kontrol paneli.

---

## 1. Amaç ve Tasarım Felsefesi

- **Tek doğruluk kaynağı:** Tüm hareketler (alış/satış) ve fiyat geçmişi tek yerde; kâr/zarar her zaman bunlardan **hesaplanır**, elle girilmez.
- **Maliyet bazlı gerçeklik:** Her varlığın "ilk giriş param"a (ağırlıklı ortalama maliyet) göre anlık durumu net.
- **Veri-yoğun ama nefes alan:** Çok bilgi, az kalabalık. Bir bakışta "iyi mi kötü mü gidiyorum" cevaplanır.
- **Eyleme dönük:** Seri seviyeleri, eşik aşımları, hedeflerle uyarır.
- **Öğreten araç:** Neden aldığımı not ettiğim karar günlüğü (journal) içerir.
- **Kişisel ve gizli:** Sağlam kimlik doğrulama + veri kuralları zorunlu. **Depo public olduğu için hiçbir gizli anahtar repoya girmez.**

---

## 2. Teknik Yığın (kesin)

| Katman | Seçim | Neden |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | En güçlü olduğun stack |
| Stil | **Tailwind CSS + shadcn/ui (CLI v4)** | Hızlı, erişilebilir, AI-ajan dostu (shadcn/skills) |
| Grafik | **Recharts** + hafif custom SVG sparkline | Finansal grafiklere uygun |
| Animasyon | **Framer Motion** | Sayfa geçişi, count-up, grafik girişi |
| Durum/Veri | **TanStack Query** + **Zustand** | Server cache + sade UI state |
| Backend/DB | **Firebase: Firestore + Auth + Cloud Functions + FCM + Hosting** | Tarım-Zekâ'dan tanıdık; realtime + auth + push tek yerde |
| Test | **Vitest** + Testing Library | Hesaplama motoru için zorunlu |
| Deploy | **Vercel** (frontend) + **Firebase** (functions/veri) | Bildiğin akış |
| Tarih/sayı | **date-fns** + `Intl.NumberFormat('tr-TR')` | TL/tarih biçimi |

> Alternatif backend: Supabase (Postgres + RLS). Bu doküman Firebase varsayar.

---

## 3. Hızlı Başlangıç & Kurulum (Claude Code BURADAN başlar)

### 3.1 Ön koşullar (önce doğrula)
```bash
node -v      # 20+ (tercihen 22 LTS) bekleniyor
npm -v
git --version
git config user.name && git config user.email   # ayarlı olmalı
```
Eksikse kullanıcıya bildir, devam etme.

### 3.2 Next.js iskeletini mevcut klasöre kur
`PortfoyOS/` klasörünün **içinde**:
```bash
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm
```
> Klasörde `.git`, `README` gibi dosyalar varsa create-next-app çoğu zaman devam eder; "conflicting files" hatası verirse mevcut çakışan dosyaları yedekleyip tekrar dene.

### 3.3 shadcn/ui (CLI v4) başlat ve bileşenleri ekle
```bash
npx shadcn@latest init -b zinc      # base color: zinc (koyu tema için ideal)
npx shadcn@latest add button card dialog input label select table tabs \
  dropdown-menu badge sonner skeleton sheet tooltip switch separator \
  avatar progress command popover calendar
```
> **Ajan bağlamı için (bunu kullan):** `npx shadcn@latest info` proje durumunu (framework, sürüm, CSS değişkenleri, kurulu bileşenler) verir. `npx shadcn@latest docs <bileşen>` herhangi bir bileşenin resmi doküman+kod örneğini getirir. UI yazmadan önce bunları çağırarak doğru kullanım bağlamını al.

### 3.4 Diğer bağımlılıklar
```bash
npm install firebase
npm install @tanstack/react-query zustand
npm install recharts framer-motion date-fns lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

### 3.5 Firebase (proje + yerel araçlar)
1. Firebase Console'dan bir proje oluştur (kullanıcı yapacaksa yönlendir): Authentication (Email/Google), Firestore (bölge: `europe-west3`), Cloud Messaging, Hosting.
2. Yerel:
```bash
npm install -g firebase-tools
firebase login
firebase init     # Firestore, Functions (TypeScript), Hosting, Emulators seç
```
3. Web app config'i `.env.local`'a koy (aşağıda).

### 3.6 Ortam değişkenleri — `.env.local` (ASLA commit edilmez)
```env
# Firebase Web config — client'a açıktır, gizli DEĞİL (güvenlik Rules+App Check ile sağlanır)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=        # web push için

# SADECE sunucu (Cloud Functions) — NEXT_PUBLIC OLMAYACAK, repoya girmeyecek
PRICE_API_KEY=
TEFAS_SOURCE_URL=
```
> **Public repo uyarısı:** Üçüncü taraf fiyat API anahtarları yalnızca Cloud Functions ortamında (`firebase functions:config` veya Secret Manager) tutulur; client koduna ve repoya **asla** girmez. Firebase web config'inin açıkta olması normaldir — koruma Firestore Security Rules + App Check iledir.

### 3.7 `.gitignore` doğrula
Next.js varsayılanı `.env*.local`'ı zaten yok sayar. Şunların ignore edildiğini garanti et:
```
node_modules/
.next/
.env*.local
functions/node_modules/
functions/lib/
*-debug.log
.firebase/
```

### 3.8 Çalıştır
```bash
npm run dev    # http://localhost:3000
```

### 3.9 Hedef klasör yapısı
```
PortfoyOS/
  .claude/                 # oturum yönetimi (INDEX, PROGRESS, BACKLOG, feature dosyaları)
  src/
    app/
      (auth)/login/
      (app)/
        page.tsx           # dashboard
        asset/[id]/
        transactions/
        analytics/
        ipo/
        goals/
        notifications/
        settings/
        admin/
      layout.tsx
      globals.css
    components/
      ui/                  # shadcn
      charts/              # Recharts sarmalayıcıları, sparkline
      dashboard/           # KPI kartı, donut, seri şeridi
      forms/               # işlem/varlık formları
      layout/              # sidebar, topbar, command palette
    lib/
      firebase/            # client init, auth, firestore yardımcıları
      calc/                # SAF hesaplama fonksiyonları (test edilir)
      providers/           # PriceProvider adapter'ları
      format/              # tr-TR para/tarih biçimleyiciler
      utils/
    hooks/
    stores/                # zustand
    types/                 # ortak tipler
  functions/               # Cloud Functions: cron, fiyat çekme, bildirim
  public/
  .env.local               # gitignored
```

---

## 4. Claude Code Çalışma Kuralları & Skill Kullanımı

### 4.1 Kurulu skill'leri kullan (ZORUNLU)
- UI/bileşen üretmeden **önce**, kurulu tasarım/frontend skill'lerini tespit et ve uygula. Buna `.claude/` altındaki kullanıcı skill'leri ve mevcutsa `frontend-design` skill'i dahildir. İlgili `SKILL.md`'yi oku, sonra kod yaz.
- **shadcn/skills (CLI v4):** Bu projede shadcn'in agent skill'lerinden ve `info`/`docs` komutlarından yararlan. Bir bileşeni kullanmadan önce `npx shadcn@latest docs <bileşen>` ile doğru API/örneği al; proje durumunu `npx shadcn@latest info` ile teyit et.
- Birden fazla skill aynı anda geçerli olabilir; hepsini gözden geçir. Hiçbiri uymuyorsa kendi tasarım sistemini (Bölüm 11) uygula.

### 4.2 Oturum yönetimi (.claude pattern — kullanıcının alışık olduğu akış)
- `.claude/INDEX.md` (proje haritası), `.claude/PROGRESS.md` (faz/iş durumu), `.claude/BACKLOG.md` (sıradaki işler) tut.
- Her oturum başında PROGRESS'i oku; "devam ediyoruz" denince kaldığın fazdan sürdür.
- Her faz sonunda PROGRESS'i güncelle ve commit at.

### 4.3 Kod ilkeleri
- **`lib/calc/` UI'dan tamamen bağımsız, saf ve testli** yazılır. Uygulamanın güveni buna bağlı; her formül için Vitest testi.
- Para birimi normalizasyonu (TRY tabanlı) en baştan doğru kurulur.
- Fiyat otomasyonu kırılgan olabilir → **manuel giriş her zaman birinci sınıf yol**.
- TypeScript strict; `any` kaçınılır.
- Her ekran tek bir soruyu cevaplar; "az ama net".

---

## 5. Git Akışı & Branch Stratejisi (kullanıcının isteği)

**Kural:** Geliştirme commit'leri ana branch'te (`main`) **görünmeyecek**. Tüm çalışma `develop` branch'inde toplanır; proje bitince `main`'e merge edilip push edilir, böylece depo ana sayfasında ürün ancak tamamlanınca belirir.

### 5.1 İlk kurulum
```bash
git init                       # yoksa
git branch -M main             # ilk branch main olsun
git remote add origin https://github.com/kaanuzavci/PortfoyOS.git

# main'i temiz başlat (sadece README/iskelet) — opsiyonel ilk push:
git add README.md .gitignore
git commit -m "chore: initial repo scaffold"
git push -u origin main

# tüm geliştirme buradan:
git checkout -b develop
git push -u origin develop
```

### 5.2 Günlük döngü (her zaman develop'ta)
```bash
git add -A
git commit -m "feat(dashboard): KPI kartları ve portföy değeri grafiği"
git push origin develop
```
- **Conventional Commits** kullan: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `style:`.
- Her **faz** sonunda mantıklı bir commit; istersen `git tag faz-3` ile işaretle.

### 5.3 Proje bitince main'e taşı
```bash
git checkout main
git merge develop
git push origin main
git tag v1.0.0 && git push origin v1.0.0
```

> **Dürüst not:** GitHub deposunun **ana sayfası varsayılan branch'i (main)** gösterir; develop commit'leri main'e merge edilene kadar orada görünmez — istediğin tam olarak budur. Ancak GitHub **katkı grafiği (contribution graph)** hangi branch olursa olsun aktiviteyi sayar; onu gizlemez. Tamamen gizlilik istiyorsan depoyu private yapana kadar grafik aktivite gösterebilir.

---

## 6. Mimari Genel Bakış

```
[Next.js UI] ──TanStack Query──▶ [Firestore] ◀── realtime listeners
     │                               ▲
     │ (manuel fiyat)                │ (günlük snapshot)
     ▼                               │
[Admin Panel] ──────────▶ [Cloud Functions (cron)]
                               │  PriceProvider adapter'ları
                               ▼
                TEFAS / BIST / Altın / Döviz / TÜFE
                               │
                               ▼
                      [Bildirim Motoru] ──FCM──▶ Web Push + In-app
```
1. **Kayıt:** İşlemler ve fiyat snapshot'ları Firestore'a yazılır.
2. **Hesaplama:** Saf fonksiyonlar işlemler+fiyatlardan tüm metrikleri türetir (client ve Function'da çalışır).
3. **Bildirim:** Günlük snapshot sonrası kurallar değerlendirilir; eşik/seri/hedef tetiklenirse bildirim üretilir.

---

## 7. Veri Modeli (Firestore — `users/{uid}/...` altında izole)

### 7.1 `assets`
```ts
type AssetType = "fon" | "hisse" | "halka_arz" | "altin" | "doviz" | "mevduat" | "kripto" | "diger";
interface Asset {
  id: string; name: string; ticker?: string; type: AssetType;
  currency: "TRY" | "USD" | "EUR" | "XAU";
  sector?: string; tags?: string[];
  priceSource?: string;            // "manuel" | "tefas" | "bist" | ...
  targetPrice?: number; stopLossPrice?: number;
  note?: string;                   // "neden aldım"
  isArchived: boolean; createdAt: Timestamp; updatedAt: Timestamp;
}
```
### 7.2 `transactions`
```ts
interface Transaction {
  id: string; assetId: string; side: "buy" | "sell";
  date: Timestamp; units: number; pricePerUnit: number;
  fee?: number; fxRate?: number;   // TRY dışıysa o günkü kur
  note?: string; createdAt: Timestamp;
}
```
### 7.3 `priceSnapshots`
```ts
interface PriceSnapshot {
  id: string; assetId: string; date: Timestamp;
  price: number; fxRateToTRY?: number; source: string;
}
```
### 7.4 `macroSnapshots` (reel getiri & benchmark)
```ts
interface MacroSnapshot {
  date: Timestamp; cpiIndex: number; bist100: number;
  gramGold: number; usdTry: number; depositRateAnnual: number;
}
```
### 7.5 `alerts`
```ts
interface Alert {
  id: string;
  type: "streak_up" | "streak_down" | "streak_broken" | "target_hit"
      | "stoploss_hit" | "daily_move" | "real_return_flip" | "ipo_new"
      | "milestone" | "rebalance";
  assetId?: string; level?: number; title: string; body: string;
  severity: "info" | "success" | "warning" | "danger";
  isRead: boolean; createdAt: Timestamp;
}
```
### 7.6 `alertRules`
```ts
interface AlertRule {
  id: string; enabled: boolean; type: Alert["type"];
  assetId?: string; threshold?: number;
  channels: ("inapp" | "push" | "email")[];
}
```
### 7.7 `goals`
```ts
interface Goal { id: string; title: string; targetAmount: number; targetDate?: Timestamp; createdAt: Timestamp; }
```

---

## 8. Hesaplama Motoru (`lib/calc/` — saf + testli)

**8.1 Pozisyon/maliyet**
- Tutulan adet = Σbuy.units − Σsell.units
- Ağırlıklı ortalama maliyet (öneri: weighted-average)
- Maliyet bazı = avg cost × tutulan adet; Güncel değer = son fiyat × tutulan adet

**8.2 Kâr/Zarar**
- Gerçekleşmemiş = (son fiyat − avg cost) × tutulan adet
- Gerçekleşmiş = satışlardan (satış − o ana kadarki avg cost) × satılan adet − masraf
- Toplam K/Z = gerçekleşmiş + gerçekleşmemiş; % getiri = Toplam K/Z / maliyet bazı

**8.3 XIRR (DCA için doğru metrik)** — her nakit akışını tarihiyle al (alış −, satış/güncel değer +), Newton-Raphson ile yıllıklandırılmış iç verimi hesapla. Dashboard'da "Yıllık getiri (XIRR)".

**8.4 Dönemsel getiri (G/H/A/Y/Tüm)** — `priceSnapshots`'tan dönem başı/sonu portföy değeri; dönem içi net yatırımı düzelt.

**8.5 Reel getiri (ZORUNLU)** — (1+nominal)/(1+dönem TÜFE) − 1. Nominal vs reel hep yan yana; reel negatife dönerse `real_return_flip`.

**8.6 Benchmark** — aynı nakit akışlarını BIST100/gram altın/mevduata uygula, sanal getiriyle kıyasla ("altını +%X geçtin").

**8.7 En çok kazandıran/kaybettiren** — %'ye ve mutlak TL'ye göre sıralama (toggle).

**8.8 Vergi/stopaj tahmini** — tipe göre kaba oran; "bugün satarsam net ~X TL". *Tavsiye değildir uyarısı + config'ten ayarlanabilir oran.*

**8.9 Seri tespiti** — ardışık günlük artış (kâr) / azalış (zarar); varlık ve portföy bazında; yön değişince sıfırla + `streak_broken`.

---

## 9. Modüller

**9.1 Dashboard** — 4 KPI kartı (Toplam Değer + günlük değişim · Toplam K/Z · Reel Getiri · XIRR, count-up'lı); portföy değeri zaman serisi (dönem toggle); dağılım donut; en çok kazandıran/kaybettiren; aktif seriler şeridi; benchmark mini-kart; bildirim merkezi kısayolu.

**9.2 Varlık detay** — fiyat grafiği + avg cost çizgisi; pozisyon özeti; işlem tablosu; seri durumu/geçmişi; hedef/stop işaretleri; journal.

**9.3 İşlemler** — filtreli/sıralanabilir tablo; hızlı ekleme modalı (⌘K'den de); CSV içe/dışa aktarma.

**9.4 Analizler** — değer/K/Z/nominal-vs-reel zaman serileri; günlük getiri **takvim ısı haritası**; varlık katkı analizi (waterfall); benchmark grafiği.

**9.5 Seri sistemi** — seviyeler (config'ten ayarlanabilir, varsayılan):

| Kâr serisi | gün | | Zarar serisi | gün |
|---|---|---|---|---|
| L1 Kıvılcım | 3 | | L1 Dikkat | 3 |
| L2 Momentum | 5 | | L2 Uyarı | 5 |
| L3 Ateş | 8 | | L3 Tehlike | 8 |
| L4 Roket | 12 | | L4 Kritik | 12 |
| L5 Zirve | 20+ | | | |

Her yeni seviyede tek bildirim (spam yok); seri kırılınca "X serisi sona erdi (Y gün)"; dashboard'da seviye göstergesi; ulaşılan seviyeler "başarımlar" (oyunlaştırma).

**9.6 Bildirim motoru** — seri (kâr/zarar/kırılma), günlük hareket eşiği, hedef/stop, reel getiri dönüşü, yeni halka arz, kilometre taşı, rebalans. Kanallar: in-app + bildirim merkezi (zorunlu), web push (FCM) + e-posta (opsiyonel). Ayarlardan açılır/kapanır, eşik değiştirilir.

**9.7 Admin panel (`/admin`)** — varlık CRUD; hızlı işlem girişi; **manuel fiyat güncelleme**; makro veri girişi (TÜFE/BIST/altın/kur/faiz); kural yönetimi; CSV/JSON içe-dışa aktarma & yedek; halka arz kaydı. Form-ağırlıklı, hızlı, klavye dostu, realtime yansıma.

**9.8 Fiyat güncelleme/veri kaynakları** — manuel (baseline, hep çalışır) + opsiyonel `PriceProvider` adapter'ları (TEFAS/BIST/altın/döviz/TÜFE). Cloud Function cron iş günü kapanışında snapshot alır, sonra bildirim motorunu çalıştırır. Provider hata verirse o varlığı atla, "güncel değil" rozeti göster, çökme.

```ts
interface PriceProvider { type: AssetType | "macro"; fetchPrice(ticker: string, date: Date): Promise<number>; }
```

---

## 10. Ekstra Modüller (önerilen — işe yarayacak)

1. **Reel getiri paneli** (enflasyon karşısı) — asıl derdin bu.
2. **Benchmark** (BIST/altın/mevduat) — "doğru seçim mi" cevabı.
3. **Halka Arz (IPO) takvimi** — yaklaşan arzları (ad, kod, fiyat, talep tarihi, lot, halka açıklık, katılım endeksi uygunluğu) listele; tarih yaklaşınca bildirim; katıldıysam tek tıkla varlık+işlem oluştur.
4. **Temettü/kupon takibi** — toplam getiriye dahil, takvim.
5. **Hedefler** — ilerleme çubuğu + XIRR'e göre tahmini ulaşma tarihi.
6. **What-if/projeksiyon** — "ayda +4.000 ₺ eklersem 1 yılda ne olur".
7. **İzleme listesi** — henüz almadığım takip ettiklerim.
8. **Karar günlüğü** — her işlemde "neden"; geriye dönük karar analizi.
9. **Yedekleme** — tek tıkla JSON/CSV indir & geri yükle.
10. **PWA + kilit** — mobilde ana ekran, push; açılışta PIN/biyometrik.
11. **Vergi/stopaj tahmin aracı**.
12. **Komut paleti (⌘K)** — her şeye klavyeyle.

---

## 11. Tasarım Sistemi

- **Koyu tema öncelikli** (zinc-950 zemin), cam efektli kartlar, ince kenarlık, yumuşak gölge, `rounded-2xl`. Opsiyonel açık tema.
- **Renk semantiği (renk körü dostu):** kazanç = emerald/teal, kayıp = rose/amber; renge ek olarak ok + işaret (+/−). Şiddet: info/success/warning/danger. Bir canlı accent.
- **Tipografi:** UI fontu Geist/Inter; **sayılar mono + `tabular-nums`** (Geist Mono/JetBrains Mono) — dikey hizalı rakamlar. Para `Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'})` → `₺1.234,56`; yüzde `%12,3`.
- **Bileşenler:** KPI kartı (count-up + sparkline), zaman serisi grafik, donut, veri tablosu (sıralanabilir/satır içi düzenleme), seri seviye göstergesi, bildirim merkezi, toast, skeleton.
- **Hareket:** Framer Motion sayfa/kart girişi (kısa, abartısız); count-up sayılar; grafik soldan çizilir; L4+ seride küçük kutlama.
- **Grafik:** Recharts (area/line/bar/donut) + hafif SVG sparkline; tema renk değişkenleriyle ışık/koyu uyumu.

---

## 12. UX Detayları

Responsive + mobil öncelikli (dashboard mobilde tek sütun, tablo yatay kaydırma, sidebar sheet'e dönüşür — 768px'te test et); boş durum ("ilk yatırımını ekle"); skeleton yükleme; zarif hata ("güncel değil" rozeti); a11y (klavye, ARIA, kontrast, sadece-renk bağımlılığı yok); Türkçe arayüz, tarih `dd.MM.yyyy`; ⌘K komut paleti + kısayollar (`n` yeni işlem, `g d` dashboard).

---

## 13. Route Haritası
```
/  Dashboard · /asset/[id] · /transactions · /analytics · /ipo
/goals · /notifications · /settings · /admin · /login
```

---

## 14. Güvenlik & Gizlilik (depo PUBLIC olduğu için kritik)

- **Firebase Auth zorunlu**; giriş yapmadan veri görünmez.
- **Firestore Rules:** `users/{uid}/**` yalnızca `request.auth.uid == uid`. Kuralları test et (emulator).
- **App Check** etkinleştir (public web config'i kötüye kullanıma karşı).
- **Gizli anahtarlar repoya ASLA girmez:** üçüncü taraf fiyat API key'leri yalnızca Functions ortamında/Secret Manager'da. `.env.local` gitignored.
- Opsiyonel PWA PIN/biyometrik kilit. Yedek dosyaları yalnızca kullanıcının cihazına iner.

---

## 15. Build Fazları (her faz sonunda develop'a commit)

- **Faz 0 — İskelet & repo:** Bölüm 3 kurulum + Bölüm 5.1 git kurulumu; layout (sidebar+topbar), tema, Firebase bağlantısı, Auth, login. → commit + tag `faz-0`.
- **Faz 1 — Veri & işlem CRUD:** Firestore modelleri, varlık ekleme, işlem ekleme, manuel fiyat.
- **Faz 2 — Hesaplama motoru:** `lib/calc/` + Vitest (maliyet, K/Z, XIRR, dönemsel, reel).
- **Faz 3 — Dashboard:** KPI kartları, değer grafiği, donut, en çok kazandıran/kaybettiren.
- **Faz 4 — Seri + bildirim:** seri tespiti, seviyeler, bildirim üretimi, merkez, toast.
- **Faz 5 — Admin panel:** tüm CRUD, makro giriş, CSV/JSON.
- **Faz 6 — Ekstra modüller:** reel, benchmark, IPO, hedefler, journal, vergi.
- **Faz 7 — Fiyat otomasyonu:** Cloud Functions cron + PriceProvider'lar (manuele düşebilen).
- **Faz 8 — Cila:** Framer Motion, ⌘K, PWA + push, tema ince ayar, skill'lerle tasarım gözden geçirme.
- **Faz 9 — Bitiş:** yedek, test, deploy (Vercel + Firebase), ardından **Bölüm 5.3** ile `main`'e merge + `v1.0.0`.

---

## 16. Definition of Done

- [ ] İşlem eklenince dashboard K/Z'si anında ve doğru güncelleniyor.
- [ ] Manuel fiyat girince değer ve grafik güncelleniyor.
- [ ] G/H/A/Y/Tüm dönem toggle'ı tüm grafiklerde çalışıyor.
- [ ] Nominal ve reel getiri birlikte gösteriliyor.
- [ ] En çok kazandıran/kaybettiren %'ye ve ₺'ye göre sıralanıyor.
- [ ] Seri seviyeleri doğru tespit ediliyor, bildirim üretiyor, kırılınca sıfırlanıyor.
- [ ] Hedef/stop tetikleyince bildirim geliyor.
- [ ] Admin'den 1 dakikada varlık + işlem eklenebiliyor.
- [ ] Mobil kullanışlı, koyu tema tutarlı, sayılar tabular hizalı.
- [ ] Yedek indirilip geri yüklenebiliyor.
- [ ] Auth olmadan veriye erişilemiyor; Firestore Rules test edildi; gizli anahtar repoda yok.
- [ ] Geliştirme `develop`'ta; `main` ancak v1.0.0'da güncellendi.

---

## 17. Kapsam Dışı (şimdilik)
Gerçek emir iletme/borsa entegrasyonu; çoklu kullanıcı paylaşımı; vergi beyannamesi üretimi (yalnızca kaba stopaj tahmini).

---

## 18. Claude Code'a Son Notlar
- Fazlara bölünerek uygula; her fazda önce plan, sonra kod.
- UI'dan önce kurulu skill'leri ve `shadcn info`/`docs`'u kullan.
- Hesaplama motorunu UI'dan bağımsız ve testli yaz.
- Manuel fiyat girişi her zaman birinci sınıf yol.
- Commit'ler **develop**'a; `main` proje bitince güncellenir.

> **Yatırım uyarısı:** Bu uygulama takip/görselleştirme aracıdır; yatırım tavsiyesi vermez, vergi/getiri hesapları tahminidir. Karar sorumluluğu kullanıcıya aittir.
