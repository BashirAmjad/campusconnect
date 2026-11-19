"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Clock, Loader2, XCircle, CircleDot, type LucideIcon } from "lucide-react";

/* ---------- fetch helper ---------- */
export async function api<T = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json: body, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: body !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
    body: body !== undefined ? JSON.stringify(body) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined" && !url.includes("/auth/")) window.location.href = "/login";
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

/* ---------- formatting ---------- */
export function fmtDate(d: string | Date, withTime = true) {
  const date = new Date(d);
  return date.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
export function timeAgo(d: string | Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); if (days < 30) return `${days}d ago`;
  return fmtDate(d, false);
}
export function fmtHours(h: number | null | undefined) {
  if (h == null) return "—";
  if (h < 24) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
}

/* ---------- badges ---------- */
const STATUS_STYLE: Record<string, { cls: string; icon: LucideIcon }> = {
  Pending: { cls: "bg-amber-50 text-amber-700 ring-amber-200", icon: Clock },
  "In Progress": { cls: "bg-blue-50 text-blue-700 ring-blue-200", icon: Loader2 },
  Resolved: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2 },
  Rejected: { cls: "bg-red-50 text-red-700 ring-red-200", icon: XCircle },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { cls: "bg-slate-100 text-slate-700 ring-slate-200", icon: CircleDot };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}
const PRIORITY_STYLE: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-sky-100 text-sky-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-600 text-white",
};
const PRIORITY_DOT: Record<string, string> = { Low: "bg-slate-400", Medium: "bg-sky-500", High: "bg-orange-500", Urgent: "bg-white animate-pulse" };
export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[priority] ?? ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority] ?? ""}`} /> {priority}
    </span>
  );
}

/* ---------- cards & states ---------- */
export function StatCard({ label, value, icon: Icon, tone = "slate", hint }: { label: string; value: ReactNode; icon: LucideIcon; tone?: "slate" | "amber" | "blue" | "green" | "red" | "navy"; hint?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    navy: "bg-navy text-white",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="card animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-blue-100 blur-xl" />
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-white ring-1 ring-blue-100">
          <Icon className="h-7 w-7 text-royal" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- confirm dialog ---------- */
export function ConfirmDialog({ open, title, text, confirmLabel = "Confirm", danger, busy, onConfirm, onClose }: {
  open: boolean; title: string; text: string; confirmLabel?: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card animate-fade-up w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{text}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- toasts ---------- */
type Toast = { id: number; kind: "success" | "error"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto card animate-fade-up flex items-start gap-3 p-4">
            {t.kind === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
            <p className="flex-1 text-sm text-slate-700">{t.text}</p>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
