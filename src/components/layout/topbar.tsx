"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, LogOut, User2, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Brand } from "./brand";
import { SidebarNav } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useAuth } from "@/lib/auth/auth-context";
import { allNavItems } from "@/lib/nav";
import { useCommandPalette } from "@/components/layout/command-palette";
import { useQuickAdd } from "@/components/forms/quick-add";
import { useHelpDialog } from "@/components/help/how-it-works-dialog";

function usePageTitle() {
  const pathname = usePathname();
  if (pathname.startsWith("/asset/")) return "Varlık Detayı";
  const match = allNavItems.find((i) =>
    i.href === "/" ? pathname === "/" : pathname.startsWith(i.href),
  );
  return match?.label ?? "PortföyOS";
}

export function Topbar() {
  const title = usePageTitle();
  const { user, signOut } = useAuth();
  const openPalette = useCommandPalette((s) => s.open);
  const openQuickAdd = useQuickAdd((s) => s.open);
  const openHelp = useHelpDialog((s) => s.open);

  const initials =
    user?.displayName?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    "PO";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      {/* Mobil menü */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menü">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Gezinme</SheetTitle>
          <div className="flex h-16 items-center border-b border-border px-5">
            <Brand />
          </div>
          <div className="overflow-y-auto px-3 py-2">
            <SidebarNav />
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="text-base font-semibold tracking-tight">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={openPalette}
          className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
        >
          <Search className="size-4" />
          <span className="pr-6">Ara veya komut…</span>
          <kbd className="rounded border border-border bg-background px-1.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <Button
          size="sm"
          className="hidden gap-1.5 sm:flex"
          onClick={openQuickAdd}
        >
          <Plus className="size-4" /> İşlem
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Nasıl çalışır?"
          onClick={openHelp}
          className="text-muted-foreground"
        >
          <HelpCircle className="size-[18px]" />
        </Button>
        <NotificationBell />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {user?.displayName ?? "Kullanıcı"}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {user?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User2 className="mr-2 size-4" /> Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()} variant="destructive">
              <LogOut className="mr-2 size-4" /> Çıkış yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
