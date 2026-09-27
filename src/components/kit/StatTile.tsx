import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Label, big tabular number, optional delta and hint. Dense: fits 4 across on a laptop, 2 on a phone. */
export function StatTile({ label, value, delta, deltaTone, hint, icon, className }: {
  label: string; value: ReactNode; delta?: string; deltaTone?: "up" | "down" | "flat"; hint?: string; icon?: ReactNode; className?: string;
}) {
  const tone = deltaTone === "up" ? "text-emerald-700" : deltaTone === "down" ? "text-red-700" : "text-slate-500";
  return (
    <div className={cn("bg-white border border-slate-200 rounded-lg px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
        {icon && <span className="text-slate-400" aria-hidden>{icon}</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-xl font-semibold text-slate-900 tabular">{value}</p>
        {delta && <span className={cn("text-xs font-medium tabular", tone)}>{delta}</span>}
      </div>
      {hint && <p className="text-xs text-slate-500 mt-0.5 truncate">{hint}</p>}
    </div>
  );
}
