"use client";

import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-all duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md relative transition-all duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 transition-all duration-200"
            >
              <X size={24} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
