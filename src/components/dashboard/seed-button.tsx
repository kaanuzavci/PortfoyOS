"use client";

import { Button } from "@/components/ui/button";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { generateSeed } from "@/lib/demo/seed";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function SeedButton({
  variant = "default",
  className,
}: {
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  const loadSeed = usePortfolioStore((s) => s.loadSeed);

  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => {
        loadSeed(generateSeed());
        toast.success("Demo portföyü yüklendi", {
          description: "6 varlık, işlemler ve 120 günlük fiyat geçmişi eklendi.",
        });
      }}
    >
      <Sparkles className="size-4" /> Demo verisi yükle
    </Button>
  );
}
