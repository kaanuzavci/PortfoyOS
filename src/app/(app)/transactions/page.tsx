"use client";

import { useMemo, useRef, useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionForm } from "@/components/forms/transaction-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeftRight,
  Plus,
  Download,
  Upload,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { formatDate, formatTRY, formatNumber } from "@/lib/format";
import {
  transactionsToCsv,
  parseTransactionsCsv,
  downloadCsv,
} from "@/lib/csv";
import { txTryPrice } from "@/lib/calc";
import { toast } from "sonner";
import type { Transaction } from "@/types";

export default function TransactionsPage() {
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const transactions = usePortfolioStore((s) => s.transactions);
  const assets = usePortfolioStore((s) => s.assets);
  const deleteTransaction = usePortfolioStore((s) => s.deleteTransaction);
  const addTransaction = usePortfolioStore((s) => s.addTransaction);
  const addAsset = usePortfolioStore((s) => s.addAsset);

  const [assetFilter, setAssetFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const filtered = useMemo(() => {
    let rows = transactions;
    if (assetFilter !== "all") rows = rows.filter((t) => t.assetId === assetFilter);
    if (sideFilter !== "all") rows = rows.filter((t) => t.side === sideFilter);
    return [...rows].sort((a, b) =>
      sortDesc ? b.date - a.date : a.date - b.date,
    );
  }, [transactions, assetFilter, sideFilter, sortDesc]);

  const exportCsv = () => {
    downloadCsv(
      `portfoyos-islemler-${new Date().toISOString().slice(0, 10)}.csv`,
      transactionsToCsv(transactions, assets),
    );
    toast.success("CSV indirildi");
  };

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseTransactionsCsv(await file.text());
      if (rows.length === 0) {
        toast.error("Geçerli satır bulunamadı");
        return;
      }
      let created = 0;
      for (const r of rows) {
        // Varlığı ticker veya ada göre eşle; yoksa oluştur
        let asset =
          assets.find(
            (a) =>
              (r.ticker && a.ticker?.toUpperCase() === r.ticker.toUpperCase()) ||
              a.name.toLowerCase() === r.assetName.toLowerCase(),
          ) ?? null;
        if (!asset) {
          asset = addAsset({
            name: r.assetName || r.ticker || "İçe aktarılan",
            ticker: r.ticker || undefined,
            type: "diger",
            currency: "TRY",
            priceSource: "manuel",
          });
        }
        addTransaction({
          assetId: asset.id,
          side: r.side,
          date: r.date,
          units: r.units,
          pricePerUnit: r.pricePerUnit,
          fee: r.fee,
          note: r.note,
        });
        created++;
      }
      toast.success(`${created} işlem içe aktarıldı`);
    } catch {
      toast.error("Dosya okunamadı");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!hydrated) return null;

  return (
    <div>
      <PageHeader
        title="İşlemler"
        description="Tüm alış/satış hareketlerin."
        actions={
          <>
            {transactions.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="size-4" /> CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="size-4" /> İçe aktar
                </Button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={importCsv}
            />
            <TransactionForm
              trigger={
                <Button size="sm">
                  <Plus className="size-4" /> Yeni işlem
                </Button>
              }
            />
          </>
        }
      />

      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Henüz işlem yok"
          description="İlk alış işlemini ekleyerek başla. K/Z otomatik hesaplanır."
          action={
            <TransactionForm
              trigger={
                <Button>
                  <Plus className="size-4" /> İşlem ekle
                </Button>
              }
            />
          }
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-44" size="sm">
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
            <Select value={sideFilter} onValueChange={setSideFilter}>
              <SelectTrigger className="w-32" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="buy">Alış</SelectItem>
                <SelectItem value="sell">Satış</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-sm text-muted-foreground">
              {filtered.length} işlem
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <button
                      onClick={() => setSortDesc((v) => !v)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Tarih <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead>Varlık</TableHead>
                  <TableHead>Yön</TableHead>
                  <TableHead className="text-right">Adet</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const a = assetMap.get(t.assetId);
                  const total = t.units * txTryPrice(t);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs tabular text-muted-foreground">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{a?.name ?? "—"}</div>
                        {a?.ticker && (
                          <div className="text-xs text-muted-foreground">
                            {a.ticker}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.side === "buy"
                              ? "border-gain/30 bg-gain-soft text-gain"
                              : "border-loss/30 bg-loss-soft text-loss"
                          }
                        >
                          {t.side === "buy" ? "Alış" : "Satış"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular">
                        {formatNumber(t.units, 4)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular">
                        {formatTRY(t.pricePerUnit)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular">
                        {formatTRY(total)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(t)}>
                              <Pencil className="mr-2 size-4" /> Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                deleteTransaction(t.id);
                                toast.success("İşlem silindi");
                              }}
                            >
                              <Trash2 className="mr-2 size-4" /> Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {editing && (
        <TransactionForm
          transaction={editing}
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}
    </div>
  );
}
