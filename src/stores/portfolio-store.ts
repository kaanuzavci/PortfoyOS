// PortföyOS — Merkezi veri deposu (tek doğruluk kaynağı).
// localStorage'a kalıcılaşır; Firebase yapılandırılmışsa ileride senkron katmanı
// bunun üstüne eklenebilir. Tüm hareketler ve fiyatlar burada; K/Z her zaman
// bunlardan HESAPLANIR (lib/calc), elle tutulmaz.
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Asset,
  Transaction,
  PriceSnapshot,
  MacroSnapshot,
  Alert,
  AlertRule,
  Goal,
  IpoEntry,
  PortfolioData,
} from "@/types";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export type { PortfolioData };

interface PortfolioState extends PortfolioData {
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Assets
  addAsset: (a: Omit<Asset, "id" | "createdAt" | "updatedAt" | "isArchived">) => Asset;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  archiveAsset: (id: string, archived: boolean) => void;
  deleteAsset: (id: string) => void;

  // Transactions
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Prices
  addPriceSnapshot: (p: Omit<PriceSnapshot, "id">) => PriceSnapshot;
  /** Bir varlık için bugünün fiyatını manuel olarak günceller (yeni snapshot). */
  setManualPrice: (assetId: string, price: number, date?: number) => void;
  /** Otomatik (sağlayıcı) kaynaklı fiyat günceller; kaynak etiketi taşır. */
  setAutoPrice: (assetId: string, price: number, source: string, date?: number) => void;
  deletePriceSnapshot: (id: string) => void;

  // Macro
  addMacroSnapshot: (m: Omit<MacroSnapshot, "id">) => MacroSnapshot;
  deleteMacroSnapshot: (id: string) => void;

  // Alerts
  addAlert: (a: Omit<Alert, "id" | "createdAt" | "isRead">) => Alert;
  /** Bildirim motoru için: aynı key daha önce üretilmişse null döner (spam yok). */
  emitAlert: (key: string, a: Omit<Alert, "id" | "createdAt" | "isRead">) => Alert | null;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  clearAlerts: () => void;

  // Bildirim motoru durumu
  seenAlertKeys: string[];
  streakMemory: Record<string, { dir: string; length: number }>;
  setStreakMemory: (m: Record<string, { dir: string; length: number }>) => void;

  // Arayüz / hesaplama tercihleri
  onboardingSeen: boolean;
  setOnboardingSeen: (v: boolean) => void;
  lastPriceFetch: number;
  setLastPriceFetch: (t: number) => void;
  costMethod: "average" | "fifo";
  setCostMethod: (m: "average" | "fifo") => void;

  // Alert rules
  upsertAlertRule: (r: AlertRule) => void;
  deleteAlertRule: (id: string) => void;

  // Goals
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => Goal;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // IPOs
  addIpo: (i: Omit<IpoEntry, "id" | "createdAt">) => IpoEntry;
  updateIpo: (id: string, patch: Partial<IpoEntry>) => void;
  deleteIpo: (id: string) => void;

  // Toplu işlemler
  importData: (data: Partial<PortfolioData>) => void;
  exportData: () => PortfolioData;
  resetAll: () => void;
  loadSeed: (data: PortfolioData) => void;
  /** Buluttan gelen tüm koleksiyonları yerel duruma yazar (senkron). */
  hydrateFromCloud: (data: PortfolioData) => void;
}

const emptyData: PortfolioData = {
  assets: [],
  transactions: [],
  priceSnapshots: [],
  macroSnapshots: [],
  alerts: [],
  alertRules: [],
  goals: [],
  ipos: [],
};

const emptyEngineState = {
  seenAlertKeys: [] as string[],
  streakMemory: {} as Record<string, { dir: string; length: number }>,
  lastPriceFetch: 0,
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      ...emptyData,
      ...emptyEngineState,
      onboardingSeen: false,
      setOnboardingSeen: (v) => set({ onboardingSeen: v }),
      setLastPriceFetch: (t) => set({ lastPriceFetch: t }),
      costMethod: "average",
      setCostMethod: (m) => set({ costMethod: m }),
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addAsset: (a) => {
        const now = Date.now();
        const asset: Asset = {
          ...a,
          id: uid(),
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ assets: [...s.assets, asset] }));
        return asset;
      },
      updateAsset: (id, patch) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
          ),
        })),
      archiveAsset: (id, archived) =>
        set((s) => ({
          assets: s.assets.map((a) =>
            a.id === id ? { ...a, isArchived: archived, updatedAt: Date.now() } : a,
          ),
        })),
      deleteAsset: (id) =>
        set((s) => ({
          assets: s.assets.filter((a) => a.id !== id),
          transactions: s.transactions.filter((t) => t.assetId !== id),
          priceSnapshots: s.priceSnapshots.filter((p) => p.assetId !== id),
        })),

      addTransaction: (t) => {
        const tx: Transaction = { ...t, id: uid(), createdAt: Date.now() };
        set((s) => ({ transactions: [...s.transactions, tx] }));
        return tx;
      },
      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        })),
      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),

      addPriceSnapshot: (p) => {
        const snap: PriceSnapshot = { ...p, id: uid() };
        set((s) => ({ priceSnapshots: [...s.priceSnapshots, snap] }));
        return snap;
      },
      setManualPrice: (assetId, price, date = Date.now()) =>
        upsertPrice(set, assetId, price, "manuel", date),
      setAutoPrice: (assetId, price, source, date = Date.now()) =>
        upsertPrice(set, assetId, price, source, date),
      deletePriceSnapshot: (id) =>
        set((s) => ({
          priceSnapshots: s.priceSnapshots.filter((p) => p.id !== id),
        })),

      addMacroSnapshot: (m) => {
        const snap: MacroSnapshot = { ...m, id: uid() };
        set((s) => ({ macroSnapshots: [...s.macroSnapshots, snap] }));
        return snap;
      },
      deleteMacroSnapshot: (id) =>
        set((s) => ({
          macroSnapshots: s.macroSnapshots.filter((m) => m.id !== id),
        })),

      addAlert: (a) => {
        const alert: Alert = {
          ...a,
          id: uid(),
          isRead: false,
          createdAt: Date.now(),
        };
        set((s) => ({ alerts: [alert, ...s.alerts] }));
        return alert;
      },
      emitAlert: (key, a) => {
        if (get().seenAlertKeys.includes(key)) return null;
        const alert: Alert = {
          ...a,
          id: uid(),
          isRead: false,
          createdAt: Date.now(),
        };
        set((s) => ({
          alerts: [alert, ...s.alerts],
          seenAlertKeys: [...s.seenAlertKeys, key],
        }));
        return alert;
      },
      setStreakMemory: (m) => set({ streakMemory: m }),
      markAlertRead: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) =>
            a.id === id ? { ...a, isRead: true } : a,
          ),
        })),
      markAllAlertsRead: () =>
        set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, isRead: true })) })),
      clearAlerts: () => set({ alerts: [] }),

      upsertAlertRule: (r) =>
        set((s) => {
          const exists = s.alertRules.some((x) => x.id === r.id);
          return {
            alertRules: exists
              ? s.alertRules.map((x) => (x.id === r.id ? r : x))
              : [...s.alertRules, r],
          };
        }),
      deleteAlertRule: (id) =>
        set((s) => ({ alertRules: s.alertRules.filter((r) => r.id !== id) })),

      addGoal: (g) => {
        const goal: Goal = { ...g, id: uid(), createdAt: Date.now() };
        set((s) => ({ goals: [...s.goals, goal] }));
        return goal;
      },
      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addIpo: (i) => {
        const ipo: IpoEntry = { ...i, id: uid(), createdAt: Date.now() };
        set((s) => ({ ipos: [...s.ipos, ipo] }));
        return ipo;
      },
      updateIpo: (id, patch) =>
        set((s) => ({
          ipos: s.ipos.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      deleteIpo: (id) =>
        set((s) => ({ ipos: s.ipos.filter((i) => i.id !== id) })),

      importData: (data) =>
        set((s) => ({
          assets: data.assets ?? s.assets,
          transactions: data.transactions ?? s.transactions,
          priceSnapshots: data.priceSnapshots ?? s.priceSnapshots,
          macroSnapshots: data.macroSnapshots ?? s.macroSnapshots,
          alerts: data.alerts ?? s.alerts,
          alertRules: data.alertRules ?? s.alertRules,
          goals: data.goals ?? s.goals,
          ipos: data.ipos ?? s.ipos,
        })),
      exportData: () => {
        const s = get();
        return {
          assets: s.assets,
          transactions: s.transactions,
          priceSnapshots: s.priceSnapshots,
          macroSnapshots: s.macroSnapshots,
          alerts: s.alerts,
          alertRules: s.alertRules,
          goals: s.goals,
          ipos: s.ipos,
        };
      },
      resetAll: () => set({ ...emptyData, ...emptyEngineState }),
      loadSeed: (data) => set({ ...data, ...emptyEngineState }),
      hydrateFromCloud: (data) =>
        set({
          assets: data.assets ?? [],
          transactions: data.transactions ?? [],
          priceSnapshots: data.priceSnapshots ?? [],
          macroSnapshots: data.macroSnapshots ?? [],
          alerts: data.alerts ?? [],
          alertRules: data.alertRules ?? [],
          goals: data.goals ?? [],
          ipos: data.ipos ?? [],
        }),
    }),
    {
      name: "portfoyos-data-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        assets: s.assets,
        transactions: s.transactions,
        priceSnapshots: s.priceSnapshots,
        macroSnapshots: s.macroSnapshots,
        alerts: s.alerts,
        alertRules: s.alertRules,
        goals: s.goals,
        ipos: s.ipos,
        seenAlertKeys: s.seenAlertKeys,
        streakMemory: s.streakMemory,
        onboardingSeen: s.onboardingSeen,
        lastPriceFetch: s.lastPriceFetch,
        costMethod: s.costMethod,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type SetFn = (fn: (s: PortfolioState) => Partial<PortfolioState>) => void;

/** Aynı güne ait fiyat varsa üzerine yazar, yoksa yeni snapshot ekler. */
function upsertPrice(
  set: SetFn,
  assetId: string,
  price: number,
  source: string,
  date: number,
) {
  const day = startOfDay(date);
  set((s) => {
    const existing = s.priceSnapshots.find(
      (p) => p.assetId === assetId && startOfDay(p.date) === day,
    );
    if (existing) {
      return {
        priceSnapshots: s.priceSnapshots.map((p) =>
          p.id === existing.id ? { ...p, price, source } : p,
        ),
      };
    }
    const snap: PriceSnapshot = { id: uid(), assetId, date, price, source };
    return { priceSnapshots: [...s.priceSnapshots, snap] };
  });
}
