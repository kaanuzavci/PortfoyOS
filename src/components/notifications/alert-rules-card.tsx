"use client";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlertType, AlertRule } from "@/types";

const MANAGED: { type: AlertType; label: string; desc: string; hasThreshold?: boolean }[] = [
  { type: "streak_up", label: "Kâr serileri", desc: "Yeni seviyeye ulaşınca" },
  { type: "streak_down", label: "Zarar serileri", desc: "Yeni seviyeye ulaşınca" },
  { type: "target_hit", label: "Hedef fiyat", desc: "Fiyat hedefe ulaşınca" },
  { type: "stoploss_hit", label: "Stop-loss", desc: "Fiyat stop seviyesinde" },
  {
    type: "daily_move",
    label: "Günlük sert hareket",
    desc: "Eşik üstü günlük değişim",
    hasThreshold: true,
  },
  { type: "real_return_flip", label: "Reel getiri dönüşü", desc: "Reel getiri negatife dönünce" },
  { type: "milestone", label: "Kilometre taşları", desc: "Değer eşiklerini geçince" },
  { type: "ipo_new", label: "Halka arz", desc: "Yeni arz kaydedilince" },
];

const DEFAULT_THRESHOLD: Partial<Record<AlertType, number>> = { daily_move: 0.05 };

export function AlertRulesCard() {
  const rules = usePortfolioStore((s) => s.alertRules);
  const upsert = usePortfolioStore((s) => s.upsertAlertRule);

  const ruleFor = (type: AlertType): AlertRule =>
    rules.find((r) => r.type === type) ?? {
      id: `r-${type}`,
      type,
      enabled: true,
      threshold: DEFAULT_THRESHOLD[type],
      channels: ["inapp"],
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bildirim kuralları</CardTitle>
        <p className="text-sm text-muted-foreground">
          Hangi olaylarda bildirim alacağını seç.
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {MANAGED.map((m) => {
          const rule = ruleFor(m.type);
          return (
            <div
              key={m.type}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/30"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.hasThreshold && rule.enabled && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="any"
                      value={((rule.threshold ?? 0.05) * 100).toString()}
                      onChange={(e) =>
                        upsert({
                          ...rule,
                          threshold: Number(e.target.value) / 100,
                        })
                      }
                      className="h-8 w-16 font-mono"
                    />
                    <Label className="text-xs text-muted-foreground">%</Label>
                  </div>
                )}
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(v) => upsert({ ...rule, enabled: v })}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
