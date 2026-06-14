# PortföyOS — İlerleme (PROGRESS)

Son güncelleme: 2026-06-14

## Tamamlanan

### ✅ Faz 0 — İskelet & repo
- Next.js 16 + TS + Tailwind v4 + shadcn/ui kuruldu.
- Rafine koyu zinc teması + finans semantik renkleri (gain/loss/warn/info), tabular-nums.
- Providers: next-themes (dark-first) + TanStack Query + Auth + Tooltip + Sonner.
- Firebase config (env varsa başlatır, yoksa **yerel demo modu**).
- Auth: Firebase veya yerel demo; AuthGuard ile rota koruması; bölünmüş login ekranı.
- Layout: sidebar (gruplu nav), topbar (başlık, ⌘K, bildirim, tema, kullanıcı), ⌘K komut paleti.

### ✅ Faz 2 — Hesaplama motoru (testli)
- `lib/calc/`: position, xirr, timeseries, real-return, benchmark, streak, tax, portfolio.
- **40 Vitest testi geçti.** (`npm test`)

### ✅ Faz 1 (temel) — Veri katmanı
- Zustand store (localStorage persist) — tüm koleksiyonlar + CRUD aksiyonları.
- Demo seed üreteci (6 varlık, işlemler, 120 günlük fiyat serisi, makro, IPO, hedef).

### ✅ Faz 3 — Dashboard
- 4 KPI kartı (count-up + sparkline): Toplam Değer, Toplam K/Z, Reel Getiri, XIRR.
- Portföy değer grafiği (Recharts, dönem toggle G/H/A/Y/Tüm + maliyet çizgisi).
- Dağılım donut (tür bazında), en çok kazandıran/kaybettiren (% / ₺ toggle).
- Aktif seriler şeridi, benchmark kıyas kartı.
- Boş durum + "Demo verisi yükle".
- Diğer rotalar: notifications, settings (yedek/geri-yükle/sıfırla), ipo, goals çalışır;
  transactions/analytics/admin placeholder.

## Sıradaki (devam buradan)

### ⏭️ Faz 1 (UI) — İşlemler & varlık CRUD
- `/transactions`: filtreli/sıralanabilir tablo, hızlı ekleme modalı (⌘K'den de), CSV.
- `/admin`: varlık CRUD, hızlı işlem, manuel fiyat güncelleme, makro veri girişi.
- Varlık detay: fiyat grafiği + avg cost çizgisi, işlem tablosu, journal.

### ⏭️ Faz 4 — Seri + bildirim motoru
- Seri/eşik/hedef değerlendirme → alert üretimi; toast + bildirim merkezi; ayarlar.

### ⏭️ Faz 5 — Admin panel (tam)
### ⏭️ Faz 6 — Analizler, IPO eylem, journal, vergi
### ⏭️ Faz 7 — Fiyat otomasyonu (Cloud Functions)
### ⏭️ Faz 8 — Cila (PWA, push, ince ayar)
### ⏭️ Faz 9 — Bitiş: deploy + main'e merge + v1.0.0

## Durum
- `npm run build` ✅ · `npm test` ✅ (40) · `npm run typecheck` ✅
- Git: local `develop` branch'inde. **Remote'a push edilmedi** (kullanıcı onayı bekleniyor).
