// Geçmiş fiyat API'si — varlıkların gerçek günlük fiyat geçmişini sunucu tarafında
// (CORS'suz) çeker. /api/prices ile aynı kapı bekçisiyle korunur.
import { NextResponse } from "next/server";
import { guardApiRequest } from "@/lib/api-guard";
import { fetchHistory, type HistoryPoint } from "@/lib/providers/history";
import type { AssetType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReqAsset {
  id: string;
  ticker?: string;
  type: AssetType;
  currency: string;
}

interface ResultRow {
  id: string;
  points: HistoryPoint[];
  source: string;
}

export async function POST(req: Request) {
  const guard = await guardApiRequest(req);
  if (!guard.ok) return guard.response;

  let assets: ReqAsset[];
  let range = "1y";
  try {
    const body = (await req.json()) as { assets?: ReqAsset[]; range?: string };
    assets = Array.isArray(body.assets) ? body.assets : [];
    if (body.range === "6mo" || body.range === "1y" || body.range === "2y") {
      range = body.range;
    }
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (assets.length === 0) return NextResponse.json({ results: [] });
  if (assets.length > 30) {
    return NextResponse.json({ error: "Çok fazla varlık" }, { status: 400 });
  }

  // Sıralı çek (rate-limit'e nazik).
  const results: ResultRow[] = [];
  for (const a of assets) {
    if (!a.ticker) {
      results.push({ id: a.id, points: [], source: "kod-yok" });
      continue;
    }
    const { points, source } = await fetchHistory(
      { ticker: a.ticker, type: a.type, currency: a.currency },
      range,
    );
    results.push({ id: a.id, points, source });
  }

  return NextResponse.json({ results, fetchedAt: Date.now() });
}
