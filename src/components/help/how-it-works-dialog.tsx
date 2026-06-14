"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePortfolioStore } from "@/stores/portfolio-store";
import {
  Calculator,
  RefreshCw,
  Target,
  TrendingUp,
  Flame,
  ShieldAlert,
} from "lucide-react";

interface HelpState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Her yerden açılabilen "Nasıl çalışır?" rehberi. */
export const useHelpDialog = create<HelpState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

const GLOSSARY: { icon: React.ElementType; term: string; desc: string }[] = [
  {
    icon: RefreshCw,
    term: "Güncel fiyat",
    desc: "Bir varlığın bugünkü birim fiyatı (örn. 1 Aselsan = 60 ₺). Sen girersin veya otomatik çekilir. Güncel değer = fiyat × adet.",
  },
  {
    icon: Calculator,
    term: "Ortalama maliyet",
    desc: "Tüm alışlarının ağırlıklı ortalaması — birim başına ortalama kaça girdiğin. Otomatik hesaplanır, elle girilmez.",
  },
  {
    icon: TrendingUp,
    term: "Kâr / Zarar",
    desc: "(Güncel fiyat − ortalama maliyet) × adet. Yani 'şu an satsam ne kazanırım'. Yüzde getiri = K/Z ÷ maliyet.",
  },
  {
    icon: Target,
    term: "Hedef fiyat",
    desc: "Senin belirlediğin 'buraya gelirse iyi olur' seviyesi. Hesaba KATILMAZ; fiyat oraya ulaşınca sadece bildirim gelir. Boş bırakabilirsin.",
  },
  {
    icon: ShieldAlert,
    term: "Stop-loss",
    desc: "'Bunun altına inerse zarar keseyim' seviyen. Hesaba katılmaz; fiyat oraya inince uyarı bildirimi gelir.",
  },
  {
    icon: Flame,
    term: "Seri (streak)",
    desc: "Üst üste artış (kâr) veya azalış (zarar) günleri. Belli gün sayılarında seviye atlar (Kıvılcım, Momentum…) ve bildirim üretir.",
  },
];

export function HowItWorksDialog() {
  const { isOpen, open, close } = useHelpDialog();
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const onboardingSeen = usePortfolioStore((s) => s.onboardingSeen);
  const setOnboardingSeen = usePortfolioStore((s) => s.setOnboardingSeen);

  // İlk girişte otomatik aç
  useEffect(() => {
    if (hydrated && !onboardingSeen) {
      open();
      setOnboardingSeen(true);
    }
  }, [hydrated, onboardingSeen, open, setOnboardingSeen]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? open() : close())}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>PortföyOS nasıl çalışır?</DialogTitle>
          <DialogDescription>
            Uygulama iki şeyden her şeyi kendi hesaplar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
            <p className="font-medium">Sadece şunları girersin:</p>
            <p className="mt-1 text-muted-foreground">
              <span className="font-medium text-foreground">1)</span> İşlemlerin —
              ne zaman, kaç adet, kaça aldın/sattın.{" "}
              <span className="font-medium text-foreground">2)</span> Güncel fiyat
              — bugünkü birim fiyat (sen girersin veya{" "}
              <span className="font-medium text-foreground">otomatik çekilir</span>).
            </p>
            <p className="mt-2 text-muted-foreground">
              Kâr/zarar, getiri, XIRR, reel getiri ve grafikler{" "}
              <span className="font-medium text-foreground">otomatik hesaplanır</span>
              ; elle girmezsin. Sonuçlar girdiğin veriler kadar doğrudur.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Kavramlar
            </p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {GLOSSARY.map((g) => (
                <li key={g.term} className="flex gap-3 p-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                    <g.icon className="size-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{g.term}</p>
                    <p className="text-xs text-muted-foreground">{g.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Not: &quot;Demo verisi yükle&quot; ile gelen sayılar rastgele örnektir,
            gerçek piyasa değildir. Yatırım tavsiyesi değildir.
          </p>

          <Button className="w-full" onClick={close}>
            Anladım
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
