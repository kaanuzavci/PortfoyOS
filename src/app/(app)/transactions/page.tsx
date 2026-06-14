"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ArrowLeftRight } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div>
      <PageHeader
        title="İşlemler"
        description="Tüm alış/satış hareketlerin; filtreli tablo ve hızlı ekleme."
      />
      <EmptyState
        icon={ArrowLeftRight}
        title="İşlemler tablosu yakında"
        description="Faz 1'de gelir: filtreli/sıralanabilir işlem tablosu, hızlı ekleme modalı ve CSV içe/dışa aktarma."
      />
    </div>
  );
}
