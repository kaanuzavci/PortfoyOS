# PortföyOS

> Kişisel yatırım takip platformu — ilk giriş maliyetlerine göre tüm yatırımlarının anlık kâr/zarar durumu; günlük/haftalık/aylık/yıllık grafikler; en çok kazandıran–kaybettiren analizleri; kâr/zarar **serisi** seviyelerine göre bildirimler. Koyu temalı, veri-yoğun bir kontrol paneli. Türk piyasası odaklı (TEFAS fonları, BIST, halka arz, altın, döviz, mevduat).

## Teknik Yığın

| Katman | Seçim |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Stil | Tailwind CSS v4 + shadcn/ui |
| Grafik | Recharts + custom SVG sparkline |
| Animasyon | Framer Motion |
| Durum/Veri | TanStack Query + Zustand (localStorage persist) |
| Backend/DB | Firebase: Firestore + Auth + Functions + FCM *(opsiyonel — yoksa yerel demo modu)* |
| Test | Vitest + Testing Library |
| Tarih/sayı | date-fns + `Intl.NumberFormat('tr-TR')` |

## Hızlı Başlangıç

```bash
npm install
npm run dev        # http://localhost:3000
```

Firebase yapılandırılmadıysa uygulama **yerel demo modunda** çalışır — herhangi bir
e-posta/şifre ile girilir, veriler tarayıcıda saklanır. Kontrol panelinden
"Demo verisi yükle" ile örnek bir portföyü hemen deneyebilirsin.

### Firebase'i etkinleştirmek (opsiyonel)

`.env.local.example` dosyasını `.env.local` olarak kopyalayıp Firebase web
config'ini doldur. **Gizli anahtarlar asla repoya girmez** — Firebase web config'i
client'a açıktır (gizli değildir); koruma `firestore.rules` + App Check iledir.

## Komutlar

```bash
npm run dev        # geliştirme sunucusu
npm run build      # production build
npm test           # Vitest (hesaplama motoru testleri)
npm run typecheck  # tsc --noEmit
```

## Mimari

- **Tek doğruluk kaynağı:** Tüm hareketler (alış/satış) ve fiyat snapshot'ları
  store'da; kâr/zarar her zaman bunlardan **hesaplanır**, elle girilmez.
- **`src/lib/calc/`** — UI'dan tamamen bağımsız, saf ve testli hesaplama motoru
  (pozisyon/maliyet, K/Z, XIRR, dönemsel & reel getiri, benchmark, seri, vergi).
- **`src/stores/portfolio-store.ts`** — kalıcı veri deposu (localStorage).
- **Manuel fiyat girişi her zaman birinci sınıf yoldur**; otomasyon opsiyoneldir.

## Git Akışı

Geliştirme `develop` branch'inde toplanır; `main` yalnızca sürüm yayınında
(v1.0.0) güncellenir. Bu yüzden depo ana sayfasında ürün ancak tamamlanınca belirir.

> **Yatırım uyarısı:** Bu uygulama takip/görselleştirme aracıdır; yatırım tavsiyesi
> vermez, vergi/getiri hesapları tahminidir. Karar sorumluluğu kullanıcıya aittir.
