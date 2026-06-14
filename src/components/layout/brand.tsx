import { cn } from "@/lib/utils";

/** PortföyOS marka kimliği — yükselen sütun grafiği simgesi + kelime işareti. */
export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-emerald-600/80 shadow-[0_4px_16px_-4px] shadow-primary/50">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-[18px] text-primary-foreground"
          aria-hidden
        >
          <rect x="3" y="13" width="3.5" height="8" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="10.25" y="8" width="3.5" height="13" rx="1" fill="currentColor" opacity="0.85" />
          <rect x="17.5" y="3" width="3.5" height="18" rx="1" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight">
          Portföy<span className="text-primary">OS</span>
        </span>
      )}
    </div>
  );
}
