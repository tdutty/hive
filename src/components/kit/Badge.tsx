import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-slate-100 text-slate-700",
      success: "bg-emerald-50 text-emerald-800",
      warning: "bg-amber-50 text-amber-800",
      danger: "bg-red-50 text-red-800",
      info: "bg-sky-50 text-sky-800",
      accent: "bg-amber-600 text-white",
      outline: "bg-white text-slate-700 border border-slate-300",
    },
  },
  defaultVariants: { tone: "neutral" },
});
const DOT: Record<NonNullable<VariantProps<typeof badgeVariants>["tone"]>, string> = { neutral: "bg-slate-400", success: "bg-emerald-500", warning: "bg-amber-500", danger: "bg-red-500", info: "bg-sky-500", accent: "bg-white", outline: "bg-slate-400" };

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { dot?: boolean }
export function Badge({ className, tone, dot, children, ...rest }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...rest}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", DOT[tone ?? "neutral"])} aria-hidden />}
      {children}
    </span>
  );
}

/** One status-to-tone map for the whole app, replacing the per-page color maps. */
export function statusTone(status: string | null | undefined): BadgeProps["tone"] {
  const s = (status || "").toLowerCase();
  if (/(active|approved|consented|partnership|sent|completed|success|paid|signed|fulfilled|online|healthy|verified)/.test(s)) return "success";
  if (/(pending|waiting|review|interested|responded|scheduled|in.?progress|draft|queued|warning)/.test(s)) return "warning";
  if (/(declined|rejected|failed|error|missed|cancel|expired|bounced|suspended|offline|critical)/.test(s)) return "danger";
  if (/(new|info|lead|open|auto|contacted|inventory)/.test(s)) return "info";
  return "neutral";
}
