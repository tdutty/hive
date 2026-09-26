"use client";

import { useCallback, useState } from "react";
import { Modal } from "./Modal";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** red confirm button for destructive actions */
  danger?: boolean;
}

/**
 * Promise-based replacement for window.confirm:
 *   const { confirm, dialog } = useConfirm();
 *   ...  if (!(await confirm({ title: "Delete this?", danger: true }))) return;
 *   ...  return (<>{dialog}...</>)
 */
export function useConfirm() {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...opts, resolve })), []);
  const close = (ok: boolean) => { state?.resolve(ok); setState(null); };

  const dialog = state ? (
    <Modal isOpen onClose={() => close(false)} title={state.title}>
      {state.message && <p className="text-sm text-slate-600 whitespace-pre-wrap">{state.message}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={() => close(false)} className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">{state.cancelLabel || "Cancel"}</button>
        <button autoFocus onClick={() => close(true)} className={`px-4 py-2 text-sm rounded-md text-white ${state.danger ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"}`}>{state.confirmLabel || "Confirm"}</button>
      </div>
    </Modal>
  ) : null;

  return { confirm, dialog };
}
