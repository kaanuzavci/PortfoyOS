"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotebookPen } from "lucide-react";
import { formatDate, formatTRY } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/types";

interface JournalEntry {
  id: string;
  date: number;
  assetId: string;
  assetName: string;
  ticker?: string;
  kind: "buy" | "sell" | "asset";
  note: string;
  detail?: string;
}

export default function JournalPage() {
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const assets = usePortfolioStore((s) => s.assets);
  const transactions = usePortfolioStore((s) => s.transactions);
  const [assetFilter, setAssetFilter] = useState("all");

  const entries = useMemo<JournalEntry[]>(() => {
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    const out: JournalEntry[] = [];

    for (const a of assets) {
      if (a.note?.trim()) {
        out.push({
          id: `a-${a.id}`,
          date: a.createdAt,
          assetId: a.id,
          assetName: a.name,
          ticker: a.ticker,
          kind: "asset",
          note: a.note.trim(),
          detail: ASSET_TYPE_LABELS[a.type],
        });
      }
    }
    for (const t of transactions) {
      if (t.note?.trim()) {
        const a = assetMap.get(t.assetId);
        out.push({
          id: `t-${t.id}`,
          date: t.date,
          assetId: t.assetId,
          assetName: a?.name ?? "—",
          ticker: a?.ticker,
          kind: t.side,
          note: t.note.trim(),
          detail: `${t.units} × ${formatTRY(t.pricePerUnit)}`,
        });
      }
    }

    const filtered =
      assetFilter === "all" ? out : out.filter((e) => e.assetId === assetFilter);
    return filtered.sort((a, b) => b.date - a.date);
  }, [assets, transactions, assetFilter]);

  if (!hydrated) return null;

  const hasAnyNotes =
    assets.some((a) => a.note?.trim()) || transactions.some((t) => t.note?.trim());

  return (
    <div>
      <PageHeader
        title="Karar Günlüğü"
        description="Neden aldım/sattım notların tek yerde — geriye dönük karar analizi."
        actions={
          hasAnyNotes && (
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-48" size="sm">
                <SelectValue placeholder="Varlık" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm varlıklar</SelectItem>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
      />

      {!hasAnyNotes ? (
        <EmptyState
          icon={NotebookPen}
          title="Henüz not yok"
          description="Varlık eklerken veya işlem girerken 'neden' notu yaz; burada tarih sırasıyla birikir ve kararlarını geriye dönük değerlendirirsin."
        />
      ) : entries.length === 0 ? (
        <EmptyState icon={NotebookPen} title="Bu varlık için not yok" />
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-5">
          {entries.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[1.55rem] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      e.kind === "buy"
                        ? "border-gain/30 bg-gain-soft text-gain"
                        : e.kind === "sell"
                          ? "border-loss/30 bg-loss-soft text-loss"
                          : ""
                    }
                  >
                    {e.kind === "buy" ? "Alış" : e.kind === "sell" ? "Satış" : "Varlık notu"}
                  </Badge>
                  <Link
                    href={`/asset/${e.assetId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {e.assetName}
                    {e.ticker && (
                      <span className="ml-1 text-muted-foreground">{e.ticker}</span>
                    )}
                  </Link>
                  {e.detail && (
                    <span className="font-mono text-xs text-muted-foreground">
                      · {e.detail}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-xs tabular text-muted-foreground">
                    {formatDate(e.date)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {e.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
