"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingUp, ShieldCheck, Flame, Info } from "lucide-react";

const highlights = [
  {
    icon: TrendingUp,
    title: "Maliyet bazlı gerçeklik",
    desc: "İlk giriş paranıza göre anlık kâr/zarar — elle değil, hesaplanarak.",
  },
  {
    icon: Flame,
    title: "Kâr & zarar serileri",
    desc: "Ardışık gün serileri, seviyeler ve eşik uyarılarıyla eyleme dönük.",
  },
  {
    icon: ShieldCheck,
    title: "Reel getiri & benchmark",
    desc: "Enflasyon, BIST, altın ve mevduata karşı gerçek performans.",
  },
];

export default function LoginPage() {
  const { user, loading, mode, signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignUp) await signUp(email, password, name);
      else await signIn(email, password);
      toast.success(isSignUp ? "Hesap oluşturuldu" : "Giriş başarılı");
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Giriş yapılamadı");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Sol — marka & değer önermesi */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-sidebar p-10 lg:flex">
        <div
          className="pointer-events-none absolute -left-32 -top-32 size-[28rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 right-0 size-[24rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--info), transparent 70%)" }}
        />
        <Brand />

        <div className="relative space-y-8">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Tüm yatırımların{" "}
            <span className="text-primary">tek bakışta</span>, ilk giriş
            maliyetine göre.
          </h2>
          <ul className="space-y-5">
            {highlights.map((h) => (
              <li key={h.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
                  <h.icon className="size-5 text-primary" />
                </span>
                <div>
                  <p className="font-medium">{h.title}</p>
                  <p className="text-sm text-muted-foreground">{h.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Yatırım tavsiyesi değildir; takip ve görselleştirme aracıdır.
        </p>
      </div>

      {/* Sağ — form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignUp ? "Hesap oluştur" : "Tekrar hoş geldin"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp
              ? "Portföyünü takip etmeye başla."
              : "Portföyüne erişmek için giriş yap."}
          </p>

          {mode === "local" && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-info/30 bg-info-soft px-3 py-2.5 text-xs text-foreground/90">
              <Info className="mt-0.5 size-3.5 shrink-0 text-info" />
              <span>
                Yerel demo modu etkin (Firebase yapılandırılmamış). Veriler bu
                tarayıcıda saklanır; herhangi bir e-posta/şifre ile girebilirsin.
              </span>
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Ad</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kaan"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sen@ornek.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Lütfen bekle…" : isSignUp ? "Hesap oluştur" : "Giriş yap"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> veya{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={google}
            disabled={busy}
          >
            <GoogleIcon /> Google ile devam et
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Zaten hesabın var mı?" : "Hesabın yok mu?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp((v) => !v)}
              className="font-medium text-primary hover:underline"
            >
              {isSignUp ? "Giriş yap" : "Kayıt ol"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
