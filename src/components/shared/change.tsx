import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSignedPercent, formatSignedTRY } from "@/lib/format";

/**
 * Yönlü değişim göstergesi: renk + ok + işaret. Renk körü dostu (renge ek olarak
 * yön oku ve +/− işareti).
 */
export function Change({
  value,
  kind = "percent",
  showIcon = true,
  fractionDigits = 1,
  className,
  size = "sm",
}: {
  value: number;
  kind?: "percent" | "currency";
  showIcon?: boolean;
  fractionDigits?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const text =
    kind === "percent"
      ? formatSignedPercent(value, fractionDigits)
      : formatSignedTRY(value);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular",
        dir === "up" && "text-gain",
        dir === "down" && "text-loss",
        dir === "flat" && "text-muted-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        size === "lg" && "text-base",
        className,
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            size === "sm" && "size-3.5",
            size === "md" && "size-4",
            size === "lg" && "size-5",
          )}
        />
      )}
      {text}
    </span>
  );
}
