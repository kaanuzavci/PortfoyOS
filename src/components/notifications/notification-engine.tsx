"use client";

import { useNotificationEngine } from "@/hooks/use-notification-engine";

/** Görünmez — bildirim motorunu uygulama yaşam döngüsüne bağlar. */
export function NotificationEngine() {
  useNotificationEngine();
  return null;
}
