"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldCheck } from "lucide-react";

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="Varlık CRUD, hızlı işlem, manuel fiyat ve makro veri girişi."
      />
      <EmptyState
        icon={ShieldCheck}
        title="Admin panel yakında"
        description="Faz 1 ve 5'te gelir: varlık ekle/düzenle, işlem gir, manuel fiyat güncelle, makro veri ve kural yönetimi."
      />
    </div>
  );
}
