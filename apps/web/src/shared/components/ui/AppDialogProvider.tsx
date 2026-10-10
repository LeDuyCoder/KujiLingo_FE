"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info } from "lucide-react";

type DialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
};
type DialogRequest = DialogOptions & { kind: "confirm" | "alert" };
type DialogContextValue = {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: Pick<DialogOptions, "title" | "description" | "confirmLabel">) => Promise<void>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useAppDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useAppDialog must be used inside AppDialogProvider");
  return context;
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const [mounted, setMounted] = useState(false);
  const resolver = useRef<((result: boolean) => void) | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback((options: DialogOptions) => new Promise<boolean>((resolve) => {
    resolver.current = resolve;
    setRequest({ kind: "confirm", ...options });
  }), []);

  const alert = useCallback(async (options: Pick<DialogOptions, "title" | "description" | "confirmLabel">) => {
    await new Promise<void>((resolve) => {
      resolver.current = () => resolve();
      setRequest({ kind: "alert", ...options });
    });
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [request, close]);

  const dialog = mounted && request ? createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) close(false); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20">
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${request.tone === "primary" ? "bg-red-50 text-[#b7152b]" : "bg-amber-50 text-amber-600"}`}>
            {request.kind === "confirm" ? <AlertTriangle size={21} /> : <Info size={21} />}
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="text-lg font-extrabold text-zinc-900">{request.title}</h2>
            <p id={descriptionId} className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600">{request.description}</p>
          </div>
        </div>
        <div className="mt-7 flex justify-end gap-2">
          {request.kind === "confirm" && <button autoFocus onClick={() => close(false)} className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50">{request.cancelLabel ?? "Hủy"}</button>}
          <button autoFocus={request.kind === "alert"} onClick={() => close(true)} className={`h-10 rounded-xl px-5 text-sm font-bold text-white transition ${request.tone === "primary" ? "bg-[#b7152b] hover:bg-[#991326]" : "bg-[#b7152b] hover:bg-[#991326]"}`}>{request.confirmLabel ?? (request.kind === "alert" ? "Đã hiểu" : "Xác nhận")}</button>
        </div>
      </section>
    </div>, document.body
  ) : null;

  return <DialogContext.Provider value={{ confirm, alert }}>{children}{dialog}</DialogContext.Provider>;
}
