"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, PlusCircle, SearchX, Download, X } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { api, EmptyState, Skeleton, PageHeader, useToast } from "./ui";
import { ComplaintTable, type ComplaintRow } from "./ComplaintTable";

type Meta = { categories: { id: number; name: string }[]; departments: { id: number; name: string }[] };
const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export default function ComplaintsList({ user }: { user: SessionUser }) {
  const toast = useToast();
  const [rows, setRows] = useState<ComplaintRow[] | null>(null);
  const [meta, setMeta] = useState<Meta>({ categories: [], departments: [] });
  const [f, setF] = useState({ q: "", status: "", priority: "", category: "", department: "", from: "", to: "" });
  const isStudent = user.role === "student";
  const isSuper = user.role === "super_admin";

  useEffect(() => { api<Meta>("/api/categories").then(setMeta).catch(() => {}); }, []);

  const qs = useMemo(() => new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString(), [f]);
  useEffect(() => {
    const t = setTimeout(() => {
      api<{ complaints: ComplaintRow[] }>(`/api/complaints?${qs}`)
        .then((d) => setRows(d.complaints))
        .catch((e) => toast("error", e.message));
    }, f.q ? 300 : 0);
    return () => clearTimeout(t);
  }, [qs]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const active = Object.values(f).some(Boolean);

  function exportCsv() {
    if (!rows?.length) return;
    const head = ["ID", "Title", "Category", "Department", "Student", "Priority", "Status", "Submitted", "Last updated"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = rows.map((r) => [r.code, r.title, r.category_name, r.department_name, r.student_name, r.priority, r.status, new Date(r.created_at).toISOString(), new Date(r.updated_at).toISOString()].map(esc).join(","));
    const blob = new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `campusconnect-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div>
      <PageHeader
        title={isStudent ? "My Complaints" : isSuper ? "All Complaints" : "Department Complaints"}
        subtitle={isStudent ? "Your complete complaint history." : isSuper ? "Every complaint across the university." : `Complaints assigned to ${user.department_name}.`}
        actions={
          <>
            {!isStudent && <button className="btn-ghost" onClick={exportCsv} disabled={!rows?.length}><Download className="h-4 w-4" /> Export CSV</button>}
            {isStudent && <Link href="/complaints/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> New Complaint</Link>}
          </>
        }
      />

      <div className="card mb-4 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by complaint ID (e.g. CC-00012), title, description, category…" value={f.q} onChange={set("q")} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <select className="input" value={f.status} onChange={set("status")}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <select className="input" value={f.priority} onChange={set("priority")}><option value="">All priorities</option>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select>
          <select className="input" value={f.category} onChange={set("category")}><option value="">All categories</option>{meta.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {isSuper ? (
            <select className="input" value={f.department} onChange={set("department")}><option value="">All departments</option>{meta.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          ) : <div className="hidden lg:block" />}
          <input type="date" className="input" value={f.from} onChange={set("from")} title="Submitted from" />
          <input type="date" className="input" value={f.to} onChange={set("to")} title="Submitted to" />
        </div>
        {active && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{rows ? `${rows.length} result${rows.length === 1 ? "" : "s"}` : "Searching…"}</span>
            <button onClick={() => setF({ q: "", status: "", priority: "", category: "", department: "", from: "", to: "" })} className="flex items-center gap-1 font-semibold text-royal hover:underline"><X className="h-3 w-3" /> Clear filters</button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {!rows ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          active ? (
            <EmptyState icon={SearchX} title="No matching complaints" text="Try a different search term or clear some filters." />
          ) : (
            <EmptyState icon={PlusCircle} title={isStudent ? "You haven't submitted any complaints" : "No complaints yet"}
              text={isStudent ? "Spotted a problem on campus? Report it and track it until it's fixed." : "Complaints will appear here as soon as students submit them."}
              action={isStudent ? <Link href="/complaints/new" className="btn-primary">Submit a complaint</Link> : undefined} />
          )
        ) : (
          <ComplaintTable rows={rows} showStudent={!isStudent} showDepartment={!(user.role === "dept_admin")} />
        )}
      </div>
    </div>
  );
}
