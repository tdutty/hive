import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** White surface, 1px border, 12px radius, no shadow. The one card in the app. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-white border border-slate-200 rounded-lg", className)} {...rest} />;
}
export function CardHeader({ title, description, actions, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-slate-200", className)}>
      <div className="min-w-0">
        <h2 className="text-md font-semibold text-slate-900 leading-6">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
export function CardBody({ className, padded = true, ...rest }: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return <div className={cn(padded && "p-4", className)} {...rest} />;
}
