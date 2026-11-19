"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellOff, CheckCheck, Bell, CheckCircle2, XCircle, MessageSquare, Send, Inbox, Loader2 } from "lucide-react";
import { api, EmptyState, PageHeader, Skeleton, fmtDate, timeAgo } from "@/components/ui";

type N = { id: number; complaint_id: number | null; type: string; title: string; message: string; is_read: boolean; created_at: string };
const ICON: Record<string, typeof Bell> = { resolved: CheckCircle2, rejected: XCircle, response: MessageSquare, submitted: Send, new: Inbox, in_progress: Loader2 };
const TONE: Record<string, string> = { resolved: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700", response: "bg-indigo-100 text-indigo-700", submitted: "bg-slate-100 text-slate-700", new: "bg-blue-100 text-blue-700", in_progress: "bg-blue-100 text-blue-700" };

export default function NotificationsPage() {
  const [items, setItems] = useState<N[] | null>(null);
  const load = () => api<{ notifications: N[] }>("/api/notifications").then((d) => setItems(d.notifications));
  useEffect(() => { load(); }, []);
  const unread = items?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notification Center" subtitle="Updates about complaint submissions, status changes and responses."
        actions={unread > 0 ? <button className="btn-ghost" onClick={async () => { await api("/api/notifications", { method: "PATCH", json: { all: true } }); load(); }}><CheckCheck className="h-4 w-4" /> Mark all as read</button> : undefined} />
      <div className="card overflow-hidden">
        {!items ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState icon={BellOff} title="No notifications yet" text="You'll be notified here when a complaint is submitted, updated, answered or closed." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => {
              const Icon = ICON[n.type] ?? Bell;
              return (
                <li key={n.id}>
                  <Link href={n.complaint_id ? `/complaints/${n.complaint_id}` : "#"}
                    onClick={() => !n.is_read && api("/api/notifications", { method: "PATCH", json: { id: n.id } })}
                    className={`flex gap-3 px-5 py-4 transition hover:bg-slate-50 ${n.is_read ? "" : "bg-blue-50/40"}`}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE[n.type] ?? "bg-slate-100 text-slate-600"}`}><Icon className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                        <span className="shrink-0 text-xs text-slate-400" title={fmtDate(n.created_at)}>{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                    </div>
                    {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-royal" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
