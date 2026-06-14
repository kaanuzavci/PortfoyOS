"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/shared/count-up";
import { Change } from "@/components/shared/change";
import { Sparkline } from "@/components/charts/sparkline";
import { InfoHint } from "@/components/shared/info-hint";
import { cn } from "@/lib/utils";

type Tone = "gain" | "loss" | "neutral" | "accent";

const toneColor: Record<Tone, string> = {
  gain: "var(--gain)",
  loss: "var(--loss)",
  neutral: "var(--muted-foreground)",
  accent: "var(--primary)",
};

export function KpiCard({
  label,
  value,
  format,
  icon: Icon,
  tone = "accent",
  delta,
  subtext,
  spark,
  hint,
  index = 0,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: { value: number; kind: "percent" | "currency" };
  subtext?: string;
  spark?: number[];
  hint?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5",
      )}
    >
      {/* arka plan glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full opacity-[0.07] blur-2xl transition-opacity group-hover:opacity-[0.14]"
        style={{ background: toneColor[tone] }}
      />

      <div className="relative flex items-start justify-between">
        <p className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
          {label}
          {hint && <InfoHint>{hint}</InfoHint>}
        </p>
        <span
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-background/40"
          style={{ color: toneColor[tone] }}
        >
          <Icon className="size-4" />
        </span>
      </div>

      <div className="relative mt-3">
        <CountUp
          value={value}
          format={format}
          className="font-mono text-2xl font-semibold tracking-tight tabular sm:text-[28px]"
        />
      </div>

      <div className="relative mt-2 flex items-center gap-2">
        {delta && <Change value={delta.value} kind={delta.kind} size="sm" />}
        {subtext && (
          <span className="text-xs text-muted-foreground">{subtext}</span>
        )}
      </div>

      {spark && spark.length > 1 && (
        <div className="relative mt-3 -mb-1">
          <Sparkline
            data={spark}
            width={260}
            height={40}
            color={toneColor[tone]}
            className="w-full"
          />
        </div>
      )}
    </motion.div>
  );
}
