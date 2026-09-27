import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Dense table: 13px cells, 40px rows, sticky header, numbers right-aligned and tabular. Wrap in a Card. */
export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return <div className="overflow-x-auto"><table className={cn("w-full text-sm", className)} {...rest} /></div>;
}
export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-slate-50 sticky top-0 z-10", className)} {...rest} />;
}
export function TH({ className, numeric, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return <th scope="col" className={cn("h-9 px-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-200 whitespace-nowrap", numeric && "text-right", className)} {...rest} />;
}
export function TBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-100", className)} {...rest} />;
}
export function TR({ className, selected, clickable, ...rest }: HTMLAttributes<HTMLTableRowElement> & { selected?: boolean; clickable?: boolean }) {
  return <tr className={cn("h-10", clickable && "cursor-pointer hover:bg-slate-50", selected && "bg-amber-50", className)} {...rest} />;
}
export function TD({ className, numeric, muted, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean; muted?: boolean }) {
  return <td className={cn("px-3 py-2 text-slate-800 align-middle", numeric && "text-right tabular", muted && "text-slate-500", className)} {...rest} />;
}
