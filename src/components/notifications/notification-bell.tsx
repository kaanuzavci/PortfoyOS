"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/types";

const severityDot: Record<AlertSeverity, string> = {
  info: "bg-info",
  success: "bg-gain",
  warning: "bg-warn",
  danger: "bg-loss",
};

export function NotificationBell() {
  const alerts = usePortfolioStore((s) => s.alerts);
  const markAllRead = usePortfolioStore((s) => s.markAllAlertsRead);
  const unread = alerts.filter((a) => !a.isRead).length;
  const recent = alerts.slice(0, 6);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Bildirimler"
          className="relative text-muted-foreground"
        >
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Bildirimler</p>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="size-3.5" /> Tümünü okundu yap
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Henüz bildirim yok.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex gap-3 px-4 py-3",
                    !a.isRead && "bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      severityDot[a.severity],
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {a.body}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                      {formatRelative(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-center">
            <Link href="/notifications">Tümünü gör</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
