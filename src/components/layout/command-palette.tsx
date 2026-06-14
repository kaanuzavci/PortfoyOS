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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggle]);

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
          <CommandItem onSelect={() => go("/transactions?new=1")}>
            <Plus className="mr-2 size-4" /> Yeni işlem ekle
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
