"use client";

import { useEffect, useState } from "react";
import { EyeOff, Lightbulb, Loader2, Send, ShieldCheck } from "lucide-react";
import { api, EmptyState, PageHeader, Skeleton, fmtDate, useToast } from "./ui";

type Cat = { id: number; name: string };
type F = { id: number; message: string; created_at: string; category_name: string | null };

export default function Suggestions({ role }: { role: string }) {
  const toast = useToast();
  const [cats, setCats] = useState<Cat[]>([]);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<F[] | null>(null);
  const isStudent = role === "student";

  useEffect(() => {
    api<{ categories: Cat[] }>("/api/categories").then((d) => setCats(d.categories));
    if (!isStudent) api<{ feedback: F[] }>("/api/feedback").then((d) => setItems(d.feedback));
  }, [isStudent]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/feedback", { method: "POST", json: { message, category_id: category ? Number(category) : null } });
      setMessage(""); setCategory("");
      toast("success", "Thank you! Your anonymous suggestion was shared.");
    } catch (err) { toast("error", (err as Error).message); } finally { setBusy(false); }
  }

  if (isStudent)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Anonymous Suggestions" subtitle="Share ideas to improve campus life. No follow-up, no identity attached." />
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Suggestions are stored <strong>without your name, email or account</strong>. Administrators only see the message. For problems that need a response, submit a complaint instead.</p>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="label">Area (optional)</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">General / campus-wide</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Your suggestion</label>
            <textarea className="input min-h-36" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={2000} placeholder="e.g. It would help to have a water cooler on the second floor of the library." />
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><EyeOff className="h-3.5 w-3.5" /> Submitted anonymously</span>
            <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Share suggestion</button>
          </div>
        </form>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Suggestions Inbox" subtitle={role === "super_admin" ? "Anonymous suggestions from students across campus." : "Anonymous suggestions related to your department."} />
      <div className="card overflow-hidden">
        {!items ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No suggestions yet" text="Anonymous ideas from students will show up here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((f) => (
              <li key={f.id} className="flex gap-3 px-5 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><Lightbulb className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm text-slate-800">{f.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{f.category_name ?? "General"} · {fmtDate(f.created_at)} · Anonymous</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
