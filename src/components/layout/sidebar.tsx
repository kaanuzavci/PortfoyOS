"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups } from "@/lib/nav";
import { Brand } from "./brand";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="flex h-full flex-col gap-1">
      {navGroups.map((group) => (
        <div key={group.label} className="mb-2">
          <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="hidden rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground/60 group-hover:inline-block lg:inline-block">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-auto px-1 pb-2 pt-4">
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <TrendingUp className="size-4 text-primary" />
            Maliyet bazlı gerçeklik
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            K/Z her zaman işlemlerinden hesaplanır, elle girilmez.
          </p>
        </div>
      </div>
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/">
          <Brand />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <SidebarNav />
      </div>
    </aside>
  );
}
