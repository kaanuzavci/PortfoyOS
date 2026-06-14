// Fiyat çekme API'si — istemciden gelen varlıklar için sunucu tarafında
// (CORS'suz) güncel fiyatları çeker. Gizli anahtarlar yalnızca burada okunur.
import { NextResponse } from "next/server";
import { resolvePrice } from "@/lib/providers";
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
  price: number | null;
  source: string;
  ok: boolean;
}

export async function POST(req: Request) {
  let assets: ReqAsset[];
  try {
    const body = (await req.json()) as { assets?: ReqAsset[] };
    assets = Array.isArray(body.assets) ? body.assets : [];
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (assets.length === 0) {
    return NextResponse.json({ results: [] });
  }
  if (assets.length > 100) {
    return NextResponse.json({ error: "Çok fazla varlık" }, { status: 400 });
  }

  const results: ResultRow[] = await Promise.all(
    assets.map(async (a): Promise<ResultRow> => {
      if (!a.ticker) {
        return { id: a.id, price: null, source: "kod-yok", ok: false };
      }
      const { price, source } = await resolvePrice({
        ticker: a.ticker,
        type: a.type,
        currency: a.currency,
      });
      return { id: a.id, price, source, ok: price != null };
    }),
  );

  return NextResponse.json({ results, fetchedAt: Date.now() });
}
