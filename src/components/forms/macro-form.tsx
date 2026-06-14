"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "./date-picker";
import { toast } from "sonner";

/** Makro veri girişi: TÜFE, BIST100, gram altın, USD/TRY, mevduat faizi. */
export function MacroForm() {
  const addMacro = usePortfolioStore((s) => s.addMacroSnapshot);
  const [date, setDate] = useState(Date.now());
  const [cpi, setCpi] = useState("");
  const [bist, setBist] = useState("");
  const [gold, setGold] = useState("");
  const [usd, setUsd] = useState("");
  const [rate, setRate] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpi || !bist || !gold || !usd) {
      toast.error("TÜFE, BIST, altın ve kur zorunlu");
      return;
    }
    addMacro({
      date,
      cpiIndex: Number(cpi),
      bist100: Number(bist),
      gramGold: Number(gold),
      usdTry: Number(usd),
      depositRateAnnual: rate ? Number(rate) / 100 : 0.4,
    });
    toast.success("Makro veri eklendi");
    setCpi("");
    setBist("");
    setGold("");
    setUsd("");
    setRate("");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Tarih</Label>
        <DatePicker value={date} onChange={setDate} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="TÜFE endeksi" value={cpi} onChange={setCpi} placeholder="100" />
        <Field label="BIST 100" value={bist} onChange={setBist} placeholder="9500" />
        <Field label="Gram altın (₺)" value={gold} onChange={setGold} placeholder="2500" />
        <Field label="USD/TRY" value={usd} onChange={setUsd} placeholder="32.50" />
        <Field
          label="Mevduat faizi (%)"
          value={rate}
          onChange={setRate}
          placeholder="45"
        />
      </div>
      <Button type="submit">Makro veri ekle</Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
      />
    </div>
  );
}
