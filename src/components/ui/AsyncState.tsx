"use client";

import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

/** Inline error strip with an optional retry. Use at the top of a page or a card. */
export function ErrorBanner({ message, onRetry, className = "" }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={`bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3 ${className}`}>
      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-red-800">Something went wrong</p>
        <p className="text-sm text-red-700 break-words">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900 border border-red-200 rounded-md px-2.5 py-1 bg-white">
          <RefreshCw size={14} aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex justify-center py-16" role="status" aria-live="polite">
      <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", hint, icon }: { title?: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="p-10 text-center text-slate-500">
      <div className="mx-auto mb-2 text-slate-300">{icon ?? <Inbox size={28} className="mx-auto" aria-hidden />}</div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
    </div>
  );
}

/**
 * One place for the three states every data view has. Renders the spinner
 * only before the first result, the error with retry, the empty state when
 * `isEmpty`, otherwise the children. Keeps previous content visible while
 * refreshing so lists do not flash.
 */
export function AsyncState({ loading, error, onRetry, isEmpty, empty, children }: {
  loading: boolean; error: string | null; onRetry?: () => void;
  isEmpty?: boolean; empty?: ReactNode; children: ReactNode;
}) {
  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;
  if (isEmpty) return <>{empty ?? <EmptyState />}</>;
  return <>{children}</>;
}
