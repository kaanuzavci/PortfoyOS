"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "./date-picker";
import { InfoHint } from "@/components/shared/info-hint";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatTRY } from "@/lib/format";
import type { Transaction } from "@/types";

export function TransactionForm({
  transaction,
  defaultAssetId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  transaction?: Transaction;
  defaultAssetId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const assets = usePortfolioStore((s) => s.assets);
  const addTransaction = usePortfolioStore((s) => s.addTransaction);
  const updateTransaction = usePortfolioStore((s) => s.updateTransaction);
  const setManualPrice = usePortfolioStore((s) => s.setManualPrice);

  const activeAssets = assets.filter((a) => !a.isArchived);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [assetId, setAssetId] = useState(
    transaction?.assetId ?? defaultAssetId ?? activeAssets[0]?.id ?? "",
  );
  const [side, setSide] = useState<"buy" | "sell">(transaction?.side ?? "buy");
  const [date, setDate] = useState(transaction?.date ?? Date.now());
  const [units, setUnits] = useState(transaction?.units?.toString() ?? "");
  const [price, setPrice] = useState(transaction?.pricePerUnit?.toString() ?? "");
  const [fee, setFee] = useState(transaction?.fee?.toString() ?? "");
  const [note, setNote] = useState(transaction?.note ?? "");
  const [alsoPrice, setAlsoPrice] = useState(!transaction);

  const isEdit = !!transaction;
  const total =
    Number(units) > 0 && Number(price) > 0
      ? Number(units) * Number(price) + (side === "buy" ? Number(fee || 0) : -Number(fee || 0))
      : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) {
      toast.error("Önce bir varlık ekle veya seç");
      return;
    }
    if (!(Number(units) > 0) || !(Number(price) > 0)) {
      toast.error("Adet ve fiyat 0'dan büyük olmalı");
      return;
    }
    const payload = {
      assetId,
      side,
      date,
      units: Number(units),
      pricePerUnit: Number(price),
      fee: fee ? Number(fee) : undefined,
      note: note.trim() || undefined,
    };

    if (isEdit) {
      updateTransaction(transaction.id, payload);
      toast.success("İşlem güncellendi");
    } else {
      addTransaction(payload);
      if (alsoPrice) setManualPrice(assetId, Number(price), date);
      toast.success(
        side === "buy" ? "Alış kaydedildi" : "Satış kaydedildi",
      );
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "İşlemi düzenle" : "Yeni işlem"}</DialogTitle>
          <DialogDescription>
            Alış/satış hareketini kaydet; K/Z otomatik hesaplanır.
          </DialogDescription>
        </DialogHeader>

        {activeAssets.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Henüz varlık yok. Önce admin panelinden bir varlık ekle.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Alış / Satış */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-1">
              {(["buy", "sell"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={cn(
                    "rounded-md py-1.5 text-sm font-medium transition-colors",
                    side === s
                      ? s === "buy"
                        ? "bg-gain-soft text-gain"
                        : "bg-loss-soft text-loss"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s === "buy" ? "Alış" : "Satış"}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>Varlık</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Varlık seç" />
                </SelectTrigger>
                <SelectContent>
                  {activeAssets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} {a.ticker ? `(${a.ticker})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tarih</Label>
              <DatePicker value={date} onChange={setDate} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-units">Adet</Label>
                <Input
                  id="t-units"
                  type="number"
                  step="any"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="font-mono"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-price">Birim fiyat</Label>
                <Input
                  id="t-price"
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-fee">Masraf / komisyon (opsiyonel)</Label>
              <Input
                id="t-fee"
                type="number"
                step="any"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm text-muted-foreground">Toplam tutar</span>
              <span className="font-mono font-semibold tabular">
                {formatTRY(total)}
              </span>
            </div>

            {!isEdit && (
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="t-alsoprice"
                  className="flex items-center gap-1 text-sm font-normal"
                >
                  Bu fiyatı güncel fiyat olarak da kaydet
                  <InfoHint>
                    Açıkken işlem fiyatın aynı zamanda &quot;bugünkü güncel
                    fiyat&quot; olarak kaydedilir; dashboard değeri hemen güncellenir.
                  </InfoHint>
                </Label>
                <Switch
                  id="t-alsoprice"
                  checked={alsoPrice}
                  onCheckedChange={setAlsoPrice}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="t-note">Not</Label>
              <Textarea
                id="t-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button type="submit">{isEdit ? "Kaydet" : "Kaydet"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
