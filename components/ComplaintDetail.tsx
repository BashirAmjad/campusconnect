"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Building2, Calendar, Tag, User, MessageSquare, Send, Loader2, CheckCircle2, Circle, XCircle, Star, ShieldAlert, Clock, FileSearch, Wrench, Printer,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { api, StatusBadge, PriorityBadge, fmtDate, timeAgo, Skeleton, ConfirmDialog, useToast, EmptyState } from "./ui";

type Complaint = {
  id: number; code: string; title: string; description: string; status: string; priority: string;
  admin_response: string | null; resolution_remarks: string | null; created_at: string; updated_at: string; closed_at: string | null;
  rating: number | null; rating_comment: string | null; category_name: string; department_name: string;
  student_name: string; student_email?: string; registration_no: string | null; has_image: boolean;
};
type History = { id: number; action: string; from_status: string | null; to_status: string | null; note: string | null; created_at: string; actor_name: string | null; actor_role: string | null };

export default function ComplaintDetail({ user, id }: { user: SessionUser; id: string }) {
  const toast = useToast();
  const [data, setData] = useState<{ complaint: Complaint; history: History[] } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const load = () =>
    api<{ complaint: Complaint; history: History[] }>(`/api/complaints/${id}`)
      .then(setData)
      .catch(() => setNotFound(true));
  useEffect(() => { load(); }, [id]);

  if (notFound)
    return (
      <div className="card">
        <EmptyState icon={ShieldAlert} title="Complaint not available" text="This complaint doesn't exist or you don't have permission to view it."
          action={<Link href="/complaints" className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Back to complaints</Link>} />
      </div>
    );
  if (!data)
    return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;

  const { complaint: c, history } = data;
  const isAdmin = user.role !== "student";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-2">
        <Link href="/complaints" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <button onClick={() => window.print()} className="btn-ghost print:hidden"><Printer className="h-4 w-4" /> Print report</button>
      </div>

      <div className="card animate-fade-up p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">{c.code}</span>
          <StatusBadge status={c.status} />
          <PriorityBadge priority={c.priority} />
        </div>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{c.title}</h1>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Meta icon={Tag} label="Category" value={c.category_name} />
          <Meta icon={Building2} label="Assigned department" value={c.department_name} />
          <Meta icon={Calendar} label="Submitted" value={fmtDate(c.created_at)} />
          <Meta icon={Clock} label="Last updated" value={timeAgo(c.updated_at)} />
          {isAdmin && <Meta icon={User} label="Student" value={`${c.student_name}${c.registration_no ? ` (${c.registration_no})` : ""}`} />}
        </div>
      </div>

      <Stepper c={c} history={history} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <p className="text-sm font-semibold text-slate-900">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{c.description}</p>
            {c.has_image && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Supporting image</p>
                <a href={`/api/complaints/${c.id}/image`} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/complaints/${c.id}/image`} alt="Complaint attachment" className="max-h-80 rounded-xl border border-slate-200 transition hover:opacity-90" />
                </a>
              </div>
            )}
          </div>

          {(c.admin_response || c.resolution_remarks) && (
            <div className={`card p-5 sm:p-6 ${c.status === "Rejected" ? "border-red-200" : c.status === "Resolved" ? "border-emerald-200" : ""}`}>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><MessageSquare className="h-4 w-4 text-royal" /> Response from {c.department_name}</p>
              {c.admin_response && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{c.admin_response}</p>}
              {c.resolution_remarks && (
                <div className={`mt-3 rounded-xl px-4 py-3 text-sm ${c.status === "Rejected" ? "bg-red-50 text-red-800" : "bg-slate-50 text-slate-700"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{c.status === "Rejected" ? "Reason for rejection" : "Remarks"}</p>
                  <p className="mt-1 whitespace-pre-wrap">{c.resolution_remarks}</p>
                </div>
              )}
            </div>
          )}

          {isAdmin && <AdminPanel c={c} onDone={() => { load(); toast("success", "Complaint updated and student notified"); }} />}
          {user.role === "student" && c.status === "Resolved" && <Rating c={c} onDone={() => { load(); toast("success", "Thanks for your feedback!"); }} />}
        </div>

        <div className="card h-fit p-5 sm:p-6">
          <p className="text-sm font-semibold text-slate-900">Activity history</p>
          <ol className="relative mt-4 space-y-5 border-l-2 border-slate-100 pl-5">
            {history.map((h) => (
              <li key={h.id} className="relative">
                <span className={`absolute -left-[27px] top-0.5 grid h-4 w-4 place-items-center rounded-full ring-4 ring-white ${dotColor(h)}`} />
                <p className="text-sm font-semibold text-slate-900">
                  {h.action === "Status Changed" ? <>Status → {h.to_status}</> : h.action}
                </p>
                <p className="text-xs text-slate-500">{fmtDate(h.created_at)}{h.actor_name ? ` · ${h.actor_role === "student" ? (isAdmin ? h.actor_name : "You") : h.actor_name}` : ""}</p>
                {h.note && <p className="mt-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">{h.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function dotColor(h: History) {
  if (h.to_status === "Resolved") return "bg-emerald-500";
  if (h.to_status === "Rejected") return "bg-red-500";
  if (h.to_status === "In Progress") return "bg-royal";
  if (h.action === "Submitted") return "bg-navy";
  return "bg-slate-300";
}

function Meta({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="font-medium leading-snug text-slate-900">{value}</p></div>
    </div>
  );
}

/** Smart tracking timeline: Submitted -> Under Review -> In Progress -> Resolved / Rejected */
function Stepper({ c, history }: { c: Complaint; history: History[] }) {
  const reviewed = history.find((h) => h.action !== "Submitted" && h.actor_role !== "student");
  const inProg = history.find((h) => h.to_status === "In Progress");
  const closed = history.slice().reverse().find((h) => h.to_status === "Resolved" || h.to_status === "Rejected");
  const rejected = c.status === "Rejected";
  const steps = [
    { label: "Submitted", icon: Send, at: c.created_at, done: true },
    { label: "Under Review", icon: FileSearch, at: reviewed?.created_at, done: !!reviewed || c.status !== "Pending" },
    { label: "In Progress", icon: Wrench, at: inProg?.created_at, done: c.status === "In Progress" || c.status === "Resolved" || (!!inProg && !rejected) },
    { label: rejected ? "Rejected" : "Resolved", icon: rejected ? XCircle : CheckCircle2, at: closed?.created_at, done: c.status === "Resolved" || rejected },
  ];
  if (rejected && !inProg) steps[2].done = false;
  const current = steps.findLastIndex((s) => s.done);
  return (
    <div className="card mt-6 p-5 sm:p-6">
      <p className="text-sm font-semibold text-slate-900">Tracking timeline</p>
      <div className="mt-5 grid grid-cols-4">
        {steps.map((s, i) => {
          const Icon = s.done ? s.icon : Circle;
          const tone = !s.done ? "bg-slate-100 text-slate-400" : rejected && i === 3 ? "bg-red-500 text-white" : i === 3 ? "bg-emerald-500 text-white" : "bg-royal text-white";
          return (
            <div key={s.label} className="relative flex flex-col items-center text-center">
              {i > 0 && <div className={`absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 ${s.done ? (rejected && i === 3 ? "bg-red-300" : "bg-royal") : "bg-slate-200"}`} />}
              <div className={`relative z-10 grid h-10 w-10 place-items-center rounded-full ${tone} ${i === current && c.status !== "Resolved" && !rejected ? "ring-4 ring-blue-100" : ""}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className={`mt-2 text-xs font-semibold sm:text-sm ${s.done ? "text-slate-900" : "text-slate-400"}`}>{s.label}</p>
              <p className="hidden text-[11px] text-slate-500 sm:block">{s.at ? fmtDate(s.at) : "—"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminPanel({ c, onDone }: { c: Complaint; onDone: () => void }) {
  const toast = useToast();
  const [status, setStatus] = useState(c.status);
  const [priority, setPriority] = useState(c.priority);
  const [response, setResponse] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const rejecting = status === "Rejected" && c.status !== "Rejected";
  const closing = (status === "Resolved" || status === "Rejected") && status !== c.status;

  async function save() {
    setBusy(true);
    try {
      const body: Record<string, string> = {};
      if (status !== c.status) body.status = status;
      if (priority !== c.priority) body.priority = priority;
      if (response.trim()) body.response = response.trim();
      if (remarks.trim()) body.remarks = remarks.trim();
      await api(`/api/complaints/${c.id}`, { method: "PATCH", json: body });
      setResponse(""); setRemarks(""); setConfirm(false);
      onDone();
    } catch (e) {
      toast("error", (e as Error).message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rejecting && remarks.trim().length < 5) return toast("error", "Please give a reason for rejecting this complaint");
    if (status === c.status && priority === c.priority && !response.trim() && !remarks.trim()) return toast("error", "Make a change or write a response first");
    if (closing) setConfirm(true); else save();
  }

  return (
    <form onSubmit={submit} className="card border-blue-100 p-5 sm:p-6">
      <p className="text-sm font-semibold text-slate-900">Manage complaint</p>
      <p className="text-xs text-slate-500">The student is notified of every status change and response.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {["Pending", "In Progress", "Resolved", "Rejected"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <div className="grid grid-cols-4 gap-1.5">
            {["Low", "Medium", "High", "Urgent"].map((p) => (
              <button type="button" key={p} onClick={() => setPriority(p)}
                className={`rounded-lg border px-1 py-2 text-xs font-semibold transition ${priority === p ? (p === "Urgent" ? "border-red-600 bg-red-600 text-white" : p === "High" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-royal bg-royal-50 text-royal") : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <label className="label">Response to student</label>
        <textarea className="input min-h-24" value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Explain what is being done about this complaint…" maxLength={3000} />
      </div>
      <div className="mt-4">
        <label className="label">{rejecting ? <span className="text-red-700">Reason for rejection (required)</span> : status === "Resolved" ? "Resolution remarks" : "Administrative remarks"}</label>
        <textarea className={`input min-h-20 ${rejecting ? "border-red-200 focus:border-red-400 focus:ring-red-100" : ""}`} value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={3000}
          placeholder={rejecting ? "Why can't this complaint be addressed?" : "Internal or closing remarks (visible to the student)"} />
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Save update</button>
      </div>
      <ConfirmDialog open={confirm} busy={busy} danger={status === "Rejected"}
        title={status === "Rejected" ? "Reject this complaint?" : "Mark as resolved?"}
        text={status === "Rejected" ? "The student will be notified with your reason. This closes the complaint." : "The student will be notified that this complaint has been resolved."}
        confirmLabel={status === "Rejected" ? "Reject complaint" : "Mark resolved"}
        onConfirm={save} onClose={() => setConfirm(false)} />
    </form>
  );
}

function Rating({ c, onDone }: { c: Complaint; onDone: () => void }) {
  const toast = useToast();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  if (c.rating)
    return (
      <div className="card p-5 sm:p-6">
        <p className="text-sm font-semibold text-slate-900">Your rating</p>
        <div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-5 w-5 ${n <= c.rating! ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}</div>
        {c.rating_comment && <p className="mt-2 text-sm text-slate-600">“{c.rating_comment}”</p>}
      </div>
    );
  async function submit() {
    setBusy(true);
    try {
      await api(`/api/complaints/${c.id}/rate`, { method: "POST", json: { rating: stars, comment: comment || undefined } });
      onDone();
    } catch (e) { toast("error", (e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="card border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-5 sm:p-6">
      <p className="text-sm font-semibold text-slate-900">How satisfied are you with the resolution?</p>
      <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onMouseEnter={() => setHover(n)} onClick={() => setStars(n)} aria-label={`${n} stars`}>
            <Star className={`h-7 w-7 transition ${n <= (hover || stars) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <div className="mt-3 animate-fade-up">
          <textarea className="input min-h-16" placeholder="Any comments? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
          <button className="btn-primary mt-3" onClick={submit} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit rating</button>
        </div>
      )}
    </div>
  );
}
