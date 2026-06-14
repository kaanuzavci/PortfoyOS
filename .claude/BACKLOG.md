# PortföyOS — Backlog (sıradaki işler)

## Yüksek öncelik (Faz 1 UI)
- [ ] İşlem ekleme/düzenleme modalı (varlık seç, alış/satış, adet, fiyat, tarih, masraf, not)
- [ ] İşlemler tablosu: filtre (varlık/tür/tarih), sıralama, sil/düzenle
- [ ] Admin: varlık ekle/düzenle formu (tür, ticker, para birimi, hedef/stop, not)
- [ ] Admin: manuel fiyat güncelleme (varlık başına, bugün/tarih)
- [ ] Admin: makro veri girişi (TÜFE, BIST100, gram altın, USD/TRY, faiz)
- [ ] Varlık detay: fiyat grafiği + ortalama maliyet çizgisi + işlem tablosu

## Faz 4 — Bildirim
- [ ] Bildirim üretim motoru: seri seviye değişimi, eşik aşımı, hedef/stop, reel dönüş
- [ ] Toast + bildirim merkezi entegrasyonu (zaten store + bell hazır)
- [ ] Kural yönetimi (alertRules) ayar ekranı; kanal/eşik

## Faz 6 — Ekstra
- [ ] Analizler: getiri takvim ısı haritası, katkı waterfall, benchmark grafiği
- [ ] IPO: katıldıysam tek tıkla varlık+işlem oluştur
- [ ] Hedefler: XIRR'e göre tahmini ulaşma tarihi, what-if projeksiyon
- [ ] Karar günlüğü (journal) — işlem başına "neden"
- [ ] CSV içe/dışa aktarma (işlemler)
- [ ] Vergi/stopaj tahmin aracı (config'ten oran)

## Faz 7+ — Otomasyon & cila
- [ ] Cloud Functions: cron snapshot + PriceProvider adapter'ları (TEFAS/BIST/altın/döviz/TÜFE)
- [ ] PWA + web push (FCM) + açılış PIN/biyometrik
- [ ] Firebase senkron katmanı (store ↔ Firestore), App Check
- [ ] L4+ seri kutlama animasyonu, başarımlar (oyunlaştırma)

## Teknik borç / notlar
- Firestore senkron katmanı henüz yok; store localStorage tabanlı (yerel mod).
- react-day-picker v10: calendar.tsx `month_grid` anahtarı kullanıldı.
- lucide-react: `ShieldPercent` yok → `Percent` kullanıldı.
