import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartLine,
  Rocket,
  Target,
  Bell,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Genel",
    items: [
      { href: "/", label: "Kontrol Paneli", icon: LayoutDashboard, shortcut: "g d" },
      { href: "/transactions", label: "İşlemler", icon: ArrowLeftRight, shortcut: "g i" },
      { href: "/analytics", label: "Analizler", icon: ChartLine, shortcut: "g a" },
    ],
  },
  {
    label: "Planlama",
    items: [
      { href: "/ipo", label: "Halka Arz", icon: Rocket },
      { href: "/goals", label: "Hedefler", icon: Target },
      { href: "/notifications", label: "Bildirimler", icon: Bell, shortcut: "g n" },
    ],
  },
  {
    label: "Yönetim",
    items: [
      { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
      { href: "/settings", label: "Ayarlar", icon: Settings },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
