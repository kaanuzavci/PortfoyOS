# PortföyOS — İlerleme (PROGRESS)

Son güncelleme: 2026-06-14

## Tamamlanan

- ✅ **Faz 0 — İskelet & repo:** Next.js 16 + TS + Tailwind v4 + shadcn/ui; koyu zinc
  teması; providers (next-themes/Query/Auth/Sonner); Firebase config (yoksa yerel
  demo modu); AuthGuard + login; sidebar/topbar/⌘K komut paleti.
- ✅ **Faz 2 — Hesaplama motoru:** lib/calc (pozisyon, K/Z, XIRR, dönemsel & reel
  getiri, benchmark, seri, vergi). **45 Vitest testi.**
- ✅ **Faz 1 — Veri & CRUD:** Zustand store (localStorage); işlem ekle/düzenle/sil
  modalı; işlemler tablosu (filtre/sıralama/CSV); varlık formu; demo seed.
- ✅ **Faz 3 — Dashboard:** 4 KPI (count-up + sparkline), değer grafiği (dönem
  toggle + maliyet), donut, en çok kazandıran/kaybettiren, seri şeridi, benchmark.
- ✅ **Faz 5 — Admin panel:** Varlıklar (CRUD + arşiv), Fiyatlar (manuel), Makro,
  Halka Arz, Hedefler sekmeleri; JSON yedek/geri-yükle/sıfırla (Ayarlar).
- ✅ **Faz 4 — Bildirim motoru:** saf değerlendirme (seri/hedef/stop/günlük/reel/
  kilometre taşı/IPO) + dedupe'lu emisyon + seri kırılması + toast + kural ayarları.
- ✅ **Faz 6 — Analizler & ekstra:** günlük getiri ısı haritası, nominal vs reel,
  varlık katkı analizi, benchmark; IPO "Katıldım" eylemi; hedef XIRR projeksiyonu;
  varlık detay (fiyat grafiği + ort. maliyet + işlem tablosu); karar notu (journal).
- ✅ **Faz 8 (kısmi) — Cila:** Framer Motion sayfa geçişleri + KPI/login girişleri;
  count-up; PWA manifest + ikon; ⌘K + "n" kısayolu.

- ✅ **Uygulama içi rehber:** InfoHint (tooltip) ipuçları; "Nasıl çalışır?" dialogu
  (model + kavram sözlüğü); ilk girişte otomatik açılır; topbar ? + ⌘K girişi.
- ✅ **Faz 7 — Otomatik fiyat çekme (Firebase'siz):** Next.js `/api/prices` Route
  Handler + PriceProvider'lar. **Hisse (Yahoo .IS), Döviz (TCMB), Kripto, Altın
  canlı çalışıyor.** Fon (TEFAS) endpoint'i değişti (ERR-006) → **manuele düşüyor**
  (zarif fallback + "güncel değil" rozeti). "Fiyatları güncelle" butonu + açılışta
  12 saatte bir otomatik yenileme.

## Durum
- `npm run build` ✅ · `npm test` ✅ (56) · `npm run typecheck` ✅
- Git: `main` (scaffold) + `develop` (tüm iş) GitHub'a push edildi.

## Bilinen kısıt
- TEFAS fon fiyat API'si (BindHistoryInfo) şu an anonim erişime "Method not found or
  disabled" döndürüyor → fonlar otomatik güncellenemiyor, manuel girilir. Yahoo/TCMB
  sorunsuz. İleride keyli bir fon kaynağı eklenebilir.

## Sıradaki (opsiyonel / Firebase gerektirir)
- ⏭️ **Faz 7 — Fiyat otomasyonu:** Cloud Functions cron + PriceProvider adapter'ları
  (TEFAS/BIST/altın/döviz/TÜFE). Manuel girişe düşebilen tasarım.
- ⏭️ **Firebase senkron:** store ↔ Firestore, App Check, FCM web push (Faz 8 kalanı).
- ⏭️ **Faz 9 — Bitiş:** Vercel + Firebase deploy; `develop` → `main` merge + `v1.0.0`.

> Not: Uygulama şu an **yerel demo modunda** tam çalışır. Firebase web config'i
> `.env.local`'a eklenince gerçek auth + (senkron katmanı yazıldığında) bulut depolama
> devreye girer. Gizli anahtarlar asla repoya girmez.
