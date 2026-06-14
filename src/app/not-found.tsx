import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Brand />
      <div>
        <p className="font-mono text-5xl font-semibold tracking-tight">404</p>
        <p className="mt-2 text-muted-foreground">
          Aradığın sayfa bulunamadı.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Kontrol paneline dön</Link>
      </Button>
    </div>
  );
}
