"use client";
import { cn } from "@/lib/utils";

export interface Chip<K extends string> { key: K; label: string; count?: number }
/** The filter row under a page header. Selected chip is dark; counts are tabular. */
export function FilterChips<K extends string>({ items, value, onChange, className }: { items: Chip<K>[]; value: K; onChange: (k: K) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map(c => (
        <button key={c.key} role="tab" aria-selected={value === c.key} onClick={() => onChange(c.key)}
          className={cn("inline-flex items-center gap-1.5 h-8 px-3 rounded-sm text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
            value === c.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400")}>
          {c.label}{c.count != null && <span className={cn("tabular text-xs", value === c.key ? "text-slate-300" : "text-slate-500")}>{c.count}</span>}
        </button>
      ))}
    </div>
  );
}
