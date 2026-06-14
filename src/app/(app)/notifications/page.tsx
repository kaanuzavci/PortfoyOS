"use client";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/types";

const dot: Record<AlertSeverity, string> = {
  info: "bg-info",
  success: "bg-gain",
  warning: "bg-warn",
  danger: "bg-loss",
};

export default function NotificationsPage() {
  const alerts = usePortfolioStore((s) => s.alerts);
  const markAll = usePortfolioStore((s) => s.markAllAlertsRead);
  const clear = usePortfolioStore((s) => s.clearAlerts);
  const markRead = usePortfolioStore((s) => s.markAlertRead);

  return (
    <div>
      <PageHeader
        title="Bildirimler"
        description="Seri, eşik, hedef ve reel getiri uyarıların."
        actions={
          alerts.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={markAll}>
                <CheckCheck className="size-4" /> Okundu işaretle
              </Button>
              <Button variant="ghost" size="sm" onClick={clear}>
                <Trash2 className="size-4" /> Temizle
              </Button>
            </>
          )
        }
      />

      {alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Bildirim yok"
          description="Seri seviyeleri, eşik aşımları ve hedefler tetiklendiğinde bildirimler burada görünür."
        />
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              onClick={() => markRead(a.id)}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30",
                !a.isRead && "border-l-2 border-l-primary",
              )}
            >
              <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", dot[a.severity])} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{a.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(a.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{a.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
