"use client";

import { useRef } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { SeedButton } from "@/components/dashboard/seed-button";
import { AlertRulesCard } from "@/components/notifications/alert-rules-card";
import { CostMethodCard } from "@/components/settings/cost-method-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Upload, Trash2, Database } from "lucide-react";
import type { PortfolioData } from "@/types";

export default function SettingsPage() {
  const { user, mode } = useAuth();
  const exportData = usePortfolioStore((s) => s.exportData);
  const importData = usePortfolioStore((s) => s.importData);
  const resetAll = usePortfolioStore((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfoyos-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Yedek indirildi");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<PortfolioData>;
      importData(parsed);
      toast.success("Yedek geri yüklendi");
    } catch {
      toast.error("Dosya okunamadı");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Ayarlar" description="Hesap, görünüm ve veri yönetimi." />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hesap</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.displayName ?? "Kullanıcı"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant={mode === "firebase" ? "default" : "secondary"}>
              {mode === "firebase" ? "Firebase" : "Yerel mod"}
            </Badge>
          </CardContent>
        </Card>

        <Card id="backup">
          <CardHeader>
            <CardTitle className="text-base">Veri & Yedekleme</CardTitle>
            <p className="text-sm text-muted-foreground">
              Veriler {mode === "firebase" ? "Firebase'de" : "bu tarayıcıda"}{" "}
              saklanır. JSON olarak indir, geri yükle ya da demo verisini dene.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={download}>
              <Download className="size-4" /> Yedek indir
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Geri yükle
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={onFile}
            />
            <SeedButton variant="secondary" />
            <Button
              variant="ghost"
              className="text-loss hover:text-loss"
              onClick={() => {
                if (confirm("Tüm veriler silinecek. Emin misin?")) {
                  resetAll();
                  toast.success("Tüm veriler sıfırlandı");
                }
              }}
            >
              <Trash2 className="size-4" /> Tümünü sıfırla
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <Database className="mr-2 inline size-4" />
              Firebase bağlantısı
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {mode === "firebase" ? (
              <p>Firebase yapılandırıldı; veriler bulutla senkronlanır.</p>
            ) : (
              <p>
                Firebase yapılandırılmadı. Bulut senkronu için{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  .env.local
                </code>{" "}
                dosyasına Firebase web config&apos;ini ekle (gizli anahtarlar
                asla repoya girmez).
              </p>
            )}
          </CardContent>
        </Card>

        <CostMethodCard />
        <AlertRulesCard />
      </div>
    </div>
  );
}
