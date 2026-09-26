"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** md (default) fits forms; lg for tables/previews */
  size?: "md" | "lg";
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: dialog semantics, Escape to close, focus moves inside on
 * open and returns to the opener on close, Tab cycles within the dialog, and
 * the page behind stops scrolling.
 */
export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`bg-white border border-slate-200 rounded-xl shadow-xl w-full ${size === "lg" ? "max-w-3xl" : "max-w-md"} max-h-[calc(100dvh-2rem)] flex flex-col relative outline-none`}
        >
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200">
            <h2 id={titleId} className="text-lg sm:text-xl font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} aria-label="Close dialog" className="p-1.5 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <X size={22} className="text-slate-500" aria-hidden />
            </button>
          </div>
          <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
