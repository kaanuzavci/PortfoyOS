"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { allNavItems } from "@/lib/nav";
import { useQuickAdd } from "@/components/forms/quick-add";
import { Plus, Moon, Sun, Download } from "lucide-react";

interface PaletteState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCommandPalette = create<PaletteState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

export function CommandPalette() {
  const { isOpen, close, toggle } = useCommandPalette();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const openQuickAdd = useQuickAdd((s) => s.open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
        return;
      }
      // Yazma alanlarında kısayolları yok say
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      // "n" → yeni işlem
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        openQuickAdd();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggle, openQuickAdd]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <CommandInput placeholder="Sayfa ara veya komut yaz…" />
      <CommandList>
        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
        <CommandGroup heading="Hızlı eylem">
          <CommandItem
            onSelect={() => {
              close();
              openQuickAdd();
            }}
          >
            <Plus className="mr-2 size-4" /> Yeni işlem ekle
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              n
            </span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin")}>
            <Plus className="mr-2 size-4" /> Yeni varlık ekle
          </CommandItem>
          <CommandItem onSelect={() => go("/settings#backup")}>
            <Download className="mr-2 size-4" /> Yedek indir
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Git">
          {allNavItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => go(item.href)}
              keywords={[item.label]}
            >
              <item.icon className="mr-2 size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Görünüm">
          <CommandItem
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              close();
            }}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="mr-2 size-4" />
            ) : (
              <Moon className="mr-2 size-4" />
            )}
            Temayı değiştir
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
