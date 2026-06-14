"use client";

import { create } from "zustand";
import { TransactionForm } from "./transaction-form";

interface QuickAddState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Her yerden açılabilen hızlı işlem ekleme diyaloğu (topbar, ⌘K, "n" kısayolu). */
export const useQuickAdd = create<QuickAddState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export function QuickAddTransaction() {
  const { isOpen, close } = useQuickAdd();
  return (
    <TransactionForm
      open={isOpen}
      onOpenChange={(v) => (v ? null : close())}
    />
  );
}
