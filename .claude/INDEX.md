# PortföyOS — Proje Haritası (INDEX)

Kişisel yatırım takip platformu. Türk piyasası odaklı, koyu temalı, veri-yoğun kontrol paneli.

## Dizin Yapısı

```
src/
  app/
    (auth)/login/          # giriş ekranı (Firebase veya yerel demo)
    (app)/                 # auth-korumalı uygulama
      page.tsx             # Dashboard
      asset/[id]/          # varlık detay
      transactions/        # işlemler (placeholder → Faz 1)
      analytics/           # analizler (placeholder → Faz 6)
      ipo/ goals/ notifications/ settings/ admin/
      layout.tsx           # sidebar + topbar + ⌘K + AuthGuard
    layout.tsx             # kök: fontlar, providers, metadata, lang=tr, dark
    globals.css            # rafine koyu zinc tema + finans semantik renkleri
  components/
    ui/                    # shadcn bileşenleri
    layout/                # brand, sidebar, topbar, theme-toggle, command-palette, auth-guard
    dashboard/             # kpi-card, period-toggle, movers-list, streak, benchmark, seed
    charts/                # value-area-chart, allocation-donut, sparkline
    notifications/         # notification-bell
    shared/                # page-header, empty-state, count-up, change
    providers/             # app-providers (theme + query + auth + tooltip + toaster)
  lib/
    calc/                  # SAF hesaplama motoru (testli) — uygulamanın güveni
    firebase/config.ts     # env varsa başlatır, yoksa null (yerel mod)
    auth/auth-context.tsx  # Firebase veya yerel demo auth
    format/                # tr-TR para/yüzde/tarih biçimleyiciler
    demo/seed.ts           # gerçekçi demo portföyü üreteci
    nav.ts utils.ts
  stores/portfolio-store.ts # kalıcı veri deposu (localStorage)
  hooks/use-portfolio.ts    # store → hesaplanmış metrikler
  types/index.ts            # ortak tipler + PortfolioData
```

## Hesaplama Motoru (`src/lib/calc/`)
- `position.ts` — ağırlıklı ortalama maliyet, K/Z
- `xirr.ts` — Newton-Raphson + bisection
- `timeseries.ts` — portföy değer serisi, dönemsel getiri
- `real-return.ts` — TÜFE'ye göre reel getiri
- `benchmark.ts` — BIST/altın/USD/mevduat kıyas
- `streak.ts` — kâr/zarar seri tespiti + seviyeler
- `tax.ts` — kaba stopaj tahmini
- `portfolio.ts` — üst düzey toplayıcı (`computePortfolio`)

## Önemli İlkeler
- K/Z her zaman işlemlerden HESAPLANIR, elle girilmez.
- Manuel fiyat girişi birinci sınıf yol; otomasyon opsiyonel.
- Public repo: gizli anahtar asla repoya girmez; güvenlik Firestore Rules + App Check.
- Git: geliştirme `develop`'ta; `main` yalnızca v1.0.0'da.
