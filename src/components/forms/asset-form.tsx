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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ASSET_TYPE_LABELS, type Asset, type AssetType, type Currency } from "@/types";

const TYPES = Object.keys(ASSET_TYPE_LABELS) as AssetType[];
const CURRENCIES: Currency[] = ["TRY", "USD", "EUR", "XAU"];

export function AssetForm({
  asset,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  asset?: Asset;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const addAsset = usePortfolioStore((s) => s.addAsset);
  const updateAsset = usePortfolioStore((s) => s.updateAsset);
  const setManualPrice = usePortfolioStore((s) => s.setManualPrice);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [name, setName] = useState(asset?.name ?? "");
  const [ticker, setTicker] = useState(asset?.ticker ?? "");
  const [type, setType] = useState<AssetType>(asset?.type ?? "hisse");
  const [currency, setCurrency] = useState<Currency>(asset?.currency ?? "TRY");
  const [sector, setSector] = useState(asset?.sector ?? "");
  const [target, setTarget] = useState(asset?.targetPrice?.toString() ?? "");
  const [stop, setStop] = useState(asset?.stopLossPrice?.toString() ?? "");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState(asset?.note ?? "");

  const isEdit = !!asset;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Varlık adı gerekli");
      return;
    }
    const payload = {
      name: name.trim(),
      ticker: ticker.trim() || undefined,
      type,
      currency,
      sector: sector.trim() || undefined,
      priceSource: "manuel",
      targetPrice: target ? Number(target) : undefined,
      stopLossPrice: stop ? Number(stop) : undefined,
      note: note.trim() || undefined,
    };

    if (isEdit) {
      updateAsset(asset.id, payload);
      toast.success("Varlık güncellendi");
    } else {
      const created = addAsset(payload);
      if (price) setManualPrice(created.id, Number(price));
      toast.success("Varlık eklendi", {
        description: price ? "Başlangıç fiyatı da kaydedildi." : undefined,
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Varlığı düzenle" : "Yeni varlık"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Varlık bilgilerini güncelle."
              : "Takip etmek istediğin varlığı tanımla."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="a-name">Ad *</Label>
            <Input
              id="a-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aselsan"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-ticker">Kod / Ticker</Label>
              <Input
                id="a-ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="ASELS"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ASSET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Para birimi</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-sector">Sektör</Label>
              <Input
                id="a-sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Savunma"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-target">Hedef fiyat</Label>
              <Input
                id="a-target"
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-stop">Stop-loss</Label>
              <Input
                id="a-stop"
                type="number"
                step="any"
                value={stop}
                onChange={(e) => setStop(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="a-price">Güncel fiyat (opsiyonel)</Label>
              <Input
                id="a-price"
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Bugünkü birim fiyat"
                className="font-mono"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="a-note">Not (neden aldım?)</Label>
            <Textarea
              id="a-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Karar günlüğü için kısa not…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit">{isEdit ? "Kaydet" : "Ekle"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
