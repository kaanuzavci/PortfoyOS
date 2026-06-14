"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AssetForm } from "@/components/forms/asset-form";
import { ManualPriceRow } from "@/components/forms/manual-price-row";
import { MacroForm } from "@/components/forms/macro-form";
import { RefreshPricesButton } from "@/components/forms/refresh-prices-button";
import { StaleBadge } from "@/components/shared/stale-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { DatePicker } from "@/components/forms/date-picker";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  ShieldCheck,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { ASSET_TYPE_LABELS } from "@/types";
import { latestPriceOf } from "@/lib/calc";
import { formatTRY, formatDate } from "@/lib/format";
import { toast } from "sonner";
import type { Asset, PriceSnapshot } from "@/types";

export default function AdminPage() {
  const hydrated = usePortfolioStore((s) => s._hasHydrated);
  const assets = usePortfolioStore((s) => s.assets);
  const snapshots = usePortfolioStore((s) => s.priceSnapshots);

  if (!hydrated) return null;
  const activeAssets = assets.filter((a) => !a.isArchived);

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="Varlık, fiyat, makro veri, halka arz ve hedef yönetimi."
        actions={
          <AssetForm
            trigger={
              <Button size="sm">
                <Plus className="size-4" /> Yeni varlık
              </Button>
            }
          />
        }
      />

      <Tabs defaultValue="assets">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="assets">Varlıklar</TabsTrigger>
          <TabsTrigger value="prices">Fiyatlar</TabsTrigger>
          <TabsTrigger value="macro">Makro</TabsTrigger>
          <TabsTrigger value="ipo">Halka Arz</TabsTrigger>
          <TabsTrigger value="goals">Hedefler</TabsTrigger>
        </TabsList>

        {/* VARLIKLAR */}
        <TabsContent value="assets">
          {assets.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Henüz varlık yok"
              description="İlk varlığını ekleyerek başla."
              action={
                <AssetForm
                  trigger={
                    <Button>
                      <Plus className="size-4" /> Varlık ekle
                    </Button>
                  }
                />
              }
            />
          ) : (
            <AssetsTable assets={assets} snapshots={snapshots} />
          )}
        </TabsContent>

        {/* FİYATLAR */}
        <TabsContent value="prices">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Fiyat güncelleme</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Otomatik çek (TEFAS/BIST/kur) ya da her varlık için elle gir.
                  Manuel giriş her zaman birinci sınıf yoldur.
                </p>
              </div>
              <RefreshPricesButton />
            </CardHeader>
            <CardContent className="space-y-2">
              {activeAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aktif varlık yok.</p>
              ) : (
                activeAssets.map((a) => <ManualPriceRow key={a.id} asset={a} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MAKRO */}
        <TabsContent value="macro">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Makro veri girişi</CardTitle>
              </CardHeader>
              <CardContent>
                <MacroForm />
              </CardContent>
            </Card>
            <MacroList />
          </div>
        </TabsContent>

        {/* HALKA ARZ */}
        <TabsContent value="ipo">
          <IpoTab />
        </TabsContent>

        {/* HEDEFLER */}
        <TabsContent value="goals">
          <GoalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssetsTable({
  assets,
  snapshots,
}: {
  assets: Asset[];
  snapshots: PriceSnapshot[];
}) {
  const archiveAsset = usePortfolioStore((s) => s.archiveAsset);
  const deleteAsset = usePortfolioStore((s) => s.deleteAsset);
  const [editing, setEditing] = useState<Asset | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Varlık</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead className="text-right">Güncel fiyat</TableHead>
            <TableHead className="text-right">Hedef / Stop</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((a) => {
            const latest = latestPriceOf(a.id, snapshots);
            return (
              <TableRow key={a.id} className={a.isArchived ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {a.name}
                    {a.isArchived && (
                      <Badge variant="secondary" className="text-[10px]">
                        Arşiv
                      </Badge>
                    )}
                  </div>
                  {a.ticker && (
                    <span className="text-xs text-muted-foreground">{a.ticker}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ASSET_TYPE_LABELS[a.type]}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono tabular">
                  <div className="flex items-center justify-end gap-2">
                    <StaleBadge latestDate={latest?.date ?? null} />
                    {latest ? formatTRY(latest.price) : "—"}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular text-muted-foreground">
                  {a.targetPrice ? formatTRY(a.targetPrice) : "—"} /{" "}
                  {a.stopLossPrice ? formatTRY(a.stopLossPrice) : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(a)}>
                        <Pencil className="mr-2 size-4" /> Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => archiveAsset(a.id, !a.isArchived)}
                      >
                        {a.isArchived ? (
                          <>
                            <ArchiveRestore className="mr-2 size-4" /> Arşivden çıkar
                          </>
                        ) : (
                          <>
                            <Archive className="mr-2 size-4" /> Arşivle
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm(
                              `${a.name} ve tüm işlemleri/fiyatları silinecek. Emin misin?`,
                            )
                          ) {
                            deleteAsset(a.id);
                            toast.success("Varlık silindi");
                          }
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

      {editing && (
        <AssetForm
          asset={editing}
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}
    </div>
  );
}

function MacroList() {
  const macro = usePortfolioStore((s) => s.macroSnapshots);
  const del = usePortfolioStore((s) => s.deleteMacroSnapshot);
  const sorted = [...macro].sort((a, b) => b.date - a.date).slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Son makro kayıtlar</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Kayıt yok.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {sorted.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span className="font-mono text-xs tabular text-muted-foreground">
                  {formatDate(m.date)}
                </span>
                <span className="font-mono text-xs tabular">
                  TÜFE {m.cpiIndex} · USD {m.usdTry}
                </span>
                <button
                  onClick={() => del(m.id)}
                  className="text-muted-foreground hover:text-loss"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function IpoTab() {
  const ipos = usePortfolioStore((s) => s.ipos);
  const addIpo = usePortfolioStore((s) => s.addIpo);
  const delIpo = usePortfolioStore((s) => s.deleteIpo);

  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(Date.now());
  const [eligible, setEligible] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ticker.trim()) {
      toast.error("Ad ve kod gerekli");
      return;
    }
    addIpo({
      name: name.trim(),
      ticker: ticker.trim().toUpperCase(),
      price: price ? Number(price) : undefined,
      demandDate: date,
      participationEligible: eligible,
    });
    toast.success("Halka arz eklendi");
    setName("");
    setTicker("");
    setPrice("");
    setEligible(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Halka arz ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ad</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Kod</Label>
                <Input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fiyat</Label>
                <Input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Talep tarihi</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Katılım endeksine uygun</Label>
              <Switch checked={eligible} onCheckedChange={setEligible} />
            </div>
            <Button type="submit">Ekle</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kayıtlı arzlar</CardTitle>
        </CardHeader>
        <CardContent>
          {ipos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kayıt yok.</p>
          ) : (
            <ul className="space-y-2">
              {ipos.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {i.name}{" "}
                      <span className="text-muted-foreground">{i.ticker}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {i.demandDate ? formatDate(i.demandDate) : "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => delIpo(i.id)}
                    className="text-muted-foreground hover:text-loss"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GoalsTab() {
  const goals = usePortfolioStore((s) => s.goals);
  const addGoal = usePortfolioStore((s) => s.addGoal);
  const delGoal = usePortfolioStore((s) => s.deleteGoal);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(Date.now());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !(Number(amount) > 0)) {
      toast.error("Başlık ve geçerli tutar gerekli");
      return;
    }
    addGoal({
      title: title.trim(),
      targetAmount: Number(amount),
      targetDate: date,
    });
    toast.success("Hedef eklendi");
    setTitle("");
    setAmount("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hedef ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Başlık</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="1 Milyon ₺ portföy"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hedef tutar (₺)</Label>
                <Input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hedef tarih</Label>
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>
            <Button type="submit">Ekle</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hedefler</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hedef yok.</p>
          ) : (
            <ul className="space-y-2">
              {goals.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{g.title}</p>
                    <p className="font-mono text-xs tabular text-muted-foreground">
                      {formatTRY(g.targetAmount)}
                    </p>
                  </div>
                  <button
                    onClick={() => delGoal(g.id)}
                    className="text-muted-foreground hover:text-loss"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
