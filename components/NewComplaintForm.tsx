"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Utensils, BookOpen, Monitor, GraduationCap, Upload, X, Loader2, Send, ArrowRight, Building2, type LucideIcon } from "lucide-react";
import { api, PageHeader, useToast } from "./ui";

type Category = { id: number; code: string; name: string; description: string; department_name: string };
const ICONS: Record<string, LucideIcon> = { CAFETERIA: Utensils, LIBRARY: BookOpen, LAB_IT: Monitor, ACADEMIC: GraduationCap };
const MAX = 2 * 1024 * 1024;

export default function NewComplaintForm() {
  const router = useRouter();
  const toast = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { api<{ categories: Category[] }>("/api/categories").then((d) => setCats(d.categories)); }, []);
  const selected = cats.find((c) => c.id === categoryId);

  function pickFile(f: File | undefined) {
    setError("");
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)) return setError("Only JPG, PNG, WEBP or GIF images are allowed");
    if (f.size > MAX) return setError("Image must be 2 MB or smaller");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!categoryId) return setError("Please choose a category");
    setBusy(true);
    const fd = new FormData();
    fd.set("category_id", String(categoryId));
    fd.set("title", title);
    fd.set("description", description);
    if (file) fd.set("image", file);
    try {
      const res = await api<{ id: number; code: string; department: string }>("/api/complaints", { method: "POST", body: fd });
      toast("success", `${res.code} submitted and routed to ${res.department}`);
      router.push(`/complaints/${res.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Submit a Complaint" subtitle="Pick a category and describe the problem. It will be routed to the responsible department automatically." />
      <form onSubmit={submit} className="space-y-5">
        <div className="card p-5 sm:p-6">
          <p className="label">1. What is this about?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {cats.length === 0 && [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
            {cats.map((c) => {
              const Icon = ICONS[c.code] ?? Building2;
              const on = c.id === categoryId;
              return (
                <button type="button" key={c.id} onClick={() => setCategoryId(c.id)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${on ? "border-royal bg-royal-50 ring-4 ring-blue-100" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? "bg-royal text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="h-5 w-5" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{c.name}</span>
                    <span className="block text-xs text-slate-500">{c.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 animate-fade-up">
              <ArrowRight className="h-4 w-4" /> Will be routed automatically to <strong>{selected.department_name}</strong>
            </div>
          )}
        </div>

        <div className="card space-y-4 p-5 sm:p-6">
          <p className="label !mb-0">2. Describe the problem</p>
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required minLength={5} placeholder="e.g. Projector not working in Room 12" />
          </div>
          <div>
            <label className="label" htmlFor="desc">Details</label>
            <textarea id="desc" className="input min-h-36" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} required minLength={15}
              placeholder="What happened, where, and when? The more detail, the faster it can be fixed." />
            <p className="mt-1 text-right text-xs text-slate-400">{description.length}/5000</p>
          </div>
          <div>
            <label className="label">Supporting image <span className="font-normal text-slate-400">(optional, max 2 MB)</span></label>
            {preview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Attachment preview" className="max-h-56 rounded-xl border border-slate-200" />
                <button type="button" onClick={() => { setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
                  className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-white shadow"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files[0]); }}
                className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500 transition hover:border-royal hover:bg-blue-50/40">
                <Upload className="mb-2 h-6 w-6 text-slate-400" />
                <span><strong className="text-royal">Click to upload</strong> or drag and drop</span>
                <span className="text-xs text-slate-400">JPG, PNG, WEBP or GIF</span>
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button className="btn-primary px-6" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit complaint</button>
        </div>
      </form>
    </div>
  );
}
