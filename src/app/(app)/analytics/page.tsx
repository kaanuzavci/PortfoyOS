"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartLine } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analizler"
        description="Değer / K-Z / nominal-reel zaman serileri, takvim ısı haritası, katkı analizi."
      />
      <EmptyState
        icon={ChartLine}
        title="Analizler yakında"
        description="Bu bölüm Faz 6'da gelir: getiri takvim ısı haritası, varlık katkı (waterfall) ve benchmark grafikleri."
      />
    </div>
  );
}
