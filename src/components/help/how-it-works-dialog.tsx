"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  PlusCircle,
  ArrowLeftRight,
  RefreshCw,
  LayoutDashboard,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

interface HelpState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Her yerden açılabilen "Nasıl çalışır?" eğitici turu. */
export const useHelpDialog = create<HelpState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

interface Step {
  icon: React.ElementType;
  tone: string; // renk değişkeni
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    tone: "var(--primary)",
    title: "PortföyOS'a hoş geldin",
    body: (
      <>
        Tüm yatırımlarını <b>tek yerde</b> takip edersin. Sen sadece{" "}
        <b>ne aldığını</b> ve <b>güncel fiyatı</b> girersin; kâr/zarar, getiri ve
        grafikleri uygulama <b>kendi hesaplar</b>.
      </>
    ),
  },
  {
    icon: PlusCircle,
    tone: "var(--info)",
    title: "1. Varlığını tanımla",
    body: (
      <>
        Neyi takip edeceğini ekle: sol menü <b>Admin Panel → Yeni varlık</b>.
        Örnek: bir hisse (ASELS) ya da <b>Gram Altın</b>. Tür ve kodu seçmen yeterli.
      </>
    ),
  },
  {
    icon: ArrowLeftRight,
    tone: "var(--gain)",
    title: "2. Alışını gir",
    body: (
      <>
        Ne kadar aldığını kaydet: üstteki <b>İşlem</b> düğmesi (veya klavyede{" "}
        <kbd className="rounded border border-border bg-muted px-1 font-mono text-xs">
          n
        </kbd>
        ) → adet, fiyat, tarih. <b>Ortalama maliyetin</b> otomatik çıkar.
      </>
    ),
  },
  {
    icon: RefreshCw,
    tone: "var(--info)",
    title: "3. Fiyatları güncelle",
    body: (
      <>
        Güncel fiyatları <b>tek tıkla çek</b> (hisse, dolar, altın). Bankadan
        dijital altın aldıysan <b>&quot;banka makası&quot;</b> moduyla bankana yakın
        fiyat görürsün.
      </>
    ),
  },
  {
    icon: LayoutDashboard,
    tone: "var(--primary)",
    title: "4. Paneli oku",
    body: (
      <ul className="space-y-1.5">
        <li>
          <b>Toplam Değer</b> — elindekilerin bugünkü değeri.
        </li>
        <li>
          <b>Kâr/Zarar</b> — maliyetine göre ne kazandın.
        </li>
        <li>
          <b>Reel Getiri</b> — enflasyon sonrası <i>gerçek</i> getiri.
        </li>
        <li>
          <b>XIRR</b> — yıllıklandırılmış getiri.
        </li>
      </ul>
    ),
  },
  {
    icon: TrendingUp,
    tone: "var(--gain)",
    title: "5. Fırsat bul",
    body: (
      <>
        İlgilendiğin hisseleri <b>İzleme Listesi</b>&apos;ne ekle. Paneldeki{" "}
        <b>&quot;Son 7 günde en çok artanlar&quot;</b> bölümünde yükseleni görür,
        tek tıkla <b>satın alıp</b> portföyüne katarsın.
      </>
    ),
  },
  {
    icon: CheckCircle2,
    tone: "var(--gain)",
    title: "Hazırsın! 🎉",
    body: (
      <>
        Kendi varlığını ekleyerek başla. Bu rehbere istediğin an üstteki{" "}
        <b>?</b> düğmesinden dönebilirsin. Acele etme — basit tut: birkaç hisse +
        altın yeter.
      </>
    ),
  },
];

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

export function HowItWorksDialog() {
  const { isOpen, open, close } = useHelpDialog();
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const onboardingSeen = usePortfolioStore((s) => s.onboardingSeen);
  const setOnboardingSeen = usePortfolioStore((s) => s.setOnboardingSeen);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (hydrated && !onboardingSeen) {
      open();
      setOnboardingSeen(true);
    }
  }, [hydrated, onboardingSeen, open, setOnboardingSeen]);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDir(1);
    }
  }, [isOpen]);

  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? open() : close())}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogTitle className="sr-only">Nasıl çalışır — rehber</DialogTitle>

        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center"
            >
              <motion.span
                initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 220, damping: 16 }}
                className="flex size-16 items-center justify-center rounded-2xl border border-border"
                style={{ background: `color-mix(in oklch, ${s.tone} 14%, transparent)` }}
              >
                <Icon className="size-8" style={{ color: s.tone }} />
              </motion.span>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">
                {s.title}
              </h2>
              <div className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* İlerleme noktaları */}
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Adım ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => go(step - 1)}>
              Geri
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={close}>
              Atla
            </Button>
          )}
          {isLast ? (
            <Button onClick={close}>Başla</Button>
          ) : (
            <Button onClick={() => go(step + 1)}>İleri</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
