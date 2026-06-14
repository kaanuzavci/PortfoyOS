"use client";

import { useRouter } from "next/navigation";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2 } from "lucide-react";
import { formatDate, formatTRY, formatPercent } from "@/lib/format";
import { toast } from "sonner";
import type { IpoEntry } from "@/types";

export default function IpoPage() {
  const ipos = usePortfolioStore((s) => s.ipos);
  const addAsset = usePortfolioStore((s) => s.addAsset);
  const addTransaction = usePortfolioStore((s) => s.addTransaction);
  const setManualPrice = usePortfolioStore((s) => s.setManualPrice);
  const router = useRouter();

  const participate = (ipo: IpoEntry) => {
    const lot = ipo.lot && ipo.lot > 0 ? ipo.lot : 1;
    const price = ipo.price ?? 0;
    if (price <= 0) {
      toast.error("Önce halka arz fiyatını gir (admin).");
      return;
    }
    const asset = addAsset({
      name: ipo.name,
      ticker: ipo.ticker,
      type: "halka_arz",
      currency: "TRY",
      priceSource: "manuel",
      note: "Halka arz katılımı",
    });
    addTransaction({
      assetId: asset.id,
      side: "buy",
      date: ipo.demandDate ?? Date.now(),
      units: lot,
      pricePerUnit: price,
      note: "Halka arz",
    });
    setManualPrice(asset.id, price, ipo.demandDate ?? Date.now());
    toast.success(`${ipo.ticker} portföye eklendi`, {
      description: `${lot} lot × ${formatTRY(price)}`,
    });
    router.push(`/asset/${asset.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Halka Arz Takvimi"
        description="Yaklaşan arzlar, talep tarihleri ve katılım endeksi uygunluğu."
      />
      {ipos.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="Kayıtlı halka arz yok"
          description="Admin panelinden halka arz ekleyebilirsin. Tarih yaklaşınca bildirim üretilir."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ipos.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.ticker}</p>
                  </div>
                  {i.participationEligible && (
                    <Badge variant="secondary" className="text-gain">
                      Katılım
                    </Badge>
                  )}
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <Row label="Fiyat" value={i.price ? formatTRY(i.price) : "—"} />
                  <Row label="Talep" value={i.demandDate ? formatDate(i.demandDate) : "—"} />
                  <Row label="Lot" value={i.lot?.toString() ?? "—"} />
                  <Row
                    label="Halka açıklık"
                    value={i.publicFloatPct ? formatPercent(i.publicFloatPct) : "—"}
                  />
                </dl>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => participate(i)}
                >
                  <CheckCircle2 className="size-4" /> Katıldım — portföye ekle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular">{value}</dd>
    </div>
  );
}
