"use client";

import { useFirestoreSync } from "@/hooks/use-firestore-sync";

/** Görünmez — Firebase modunda portföyü bulutla senkronlar (yerel modda no-op). */
export function FirestoreSync() {
  useFirestoreSync();
  return null;
}
