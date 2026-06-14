// Basit CSV içe/dışa aktarma (işlemler için). tr-TR uyumlu; ayraç virgül,
// ondalık nokta (Excel TR için noktalı virgül de denenir).
import type { Transaction, Asset } from "@/types";

const HEADERS = ["tarih", "varlik", "ticker", "tur", "adet", "fiyat", "masraf", "not"];

function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function transactionsToCsv(
  transactions: Transaction[],
  assets: Asset[],
): string {
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const rows = [HEADERS.join(",")];
  for (const t of [...transactions].sort((a, b) => a.date - b.date)) {
    const a = assetMap.get(t.assetId);
    const cells = [
      toISODate(t.date),
      a?.name ?? "",
      a?.ticker ?? "",
      t.side,
      t.units,
      t.pricePerUnit,
      t.fee ?? "",
      (t.note ?? "").replace(/"/g, '""'),
    ];
    rows.push(
      cells
        .map((c) => (typeof c === "string" && c.includes(",") ? `"${c}"` : c))
        .join(","),
    );
  }
  return rows.join("\n");
}

export interface ParsedTxRow {
  date: number;
  assetName: string;
  ticker: string;
  side: "buy" | "sell";
  units: number;
  pricePerUnit: number;
  fee?: number;
  note?: string;
}

export function parseTransactionsCsv(text: string): ParsedTxRow[] {
  const sep = text.includes(";") && !text.split("\n")[0].includes(",") ? ";" : ",";
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows: ParsedTxRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    if (cols.length < 6) continue;
    const [tarih, varlik, ticker, tur, adet, fiyat, masraf, not] = cols;
    const side = tur?.toLowerCase().startsWith("s") ? "sell" : "buy";
    const date = Date.parse(tarih);
    rows.push({
      date: Number.isFinite(date) ? date : Date.now(),
      assetName: varlik?.trim() ?? "",
      ticker: ticker?.trim() ?? "",
      side,
      units: Number(String(adet).replace(",", ".")) || 0,
      pricePerUnit: Number(String(fiyat).replace(",", ".")) || 0,
      fee: masraf ? Number(String(masraf).replace(",", ".")) : undefined,
      note: not?.trim() || undefined,
    });
  }
  return rows.filter((r) => r.units > 0 && r.pricePerUnit > 0);
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === sep && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
