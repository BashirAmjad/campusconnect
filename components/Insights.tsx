"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Repeat, Sparkles, Timer, Star, CheckCircle2 } from "lucide-react";
import { api, EmptyState, PageHeader, Skeleton, StatusBadge, fmtHours } from "./ui";
import { ChartCard, CategoryBars, TrendArea, DepartmentBars } from "./Charts";

type Perf = { id: number; name: string; total: number; pending: number; in_progress: number; resolved: number; rejected: number; resolution_rate: number; avg_resolution_hours: number | null; avg_rating: number | null };
type Stats = { byCategory: { name: string; value: number }[]; trend: { date: string; submitted: number; resolved: number }[]; performance: Perf[]; byPriority: { name: string; value: number }[] };
type Cluster = { category_name: string; department_name: string; count: number; open: number; keywords: string[]; complaints: { id: number; code: string; title: string; status: string }[] };

function speedTone(h: number | null) {
  if (h == null) return "bg-slate-100 text-slate-500";
  if (h <= 48) return "bg-emerald-100 text-emerald-700";
  if (h <= 120) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function Insights({ role }: { role: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [clusters, setClusters] = useState<Cluster[] | null>(null);
  useEffect(() => {
    api<Stats>("/api/stats").then(setStats);
    api<{ clusters: Cluster[] }>("/api/recurring").then((d) => setClusters(d.clusters));
  }, []);
  const isSuper = role === "super_admin";

  return (
    <div>
      <PageHeader title={isSuper ? "Insights & Recurring Issues" : "Department Insights"} subtitle="Performance metrics and repeated problems detected from live complaint data." />

      <div className="card mb-6 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700"><Repeat className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-semibold">Recurring issue detection</p>
            <p className="text-xs text-slate-500">Complaints in the same category with similar wording (last 90 days). Highlighted only, never merged.</p>
          </div>
        </div>
        {!clusters ? (
          <div className="space-y-3 p-5">{[0, 1].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : clusters.length === 0 ? (
          <EmptyState icon={Sparkles} title="No recurring issues detected" text="When several students report a similar problem, it will be grouped here so you can fix the root cause." />
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {clusters.map((cl, i) => (
              <div key={i} className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">{cl.category_name}</p>
                    <p className="text-sm text-slate-500">{cl.department_name}</p>
                  </div>
                  <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">{cl.count} similar · {cl.open} open</span>
                </div>
                {cl.keywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">{cl.keywords.map((k) => <span key={k} className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">#{k}</span>)}</div>
                )}
                <ul className="mt-3 space-y-1.5">
                  {cl.complaints.map((c) => (
                    <li key={c.id}>
                      <Link href={`/complaints/${c.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
                        <span className="min-w-0 truncate"><span className="font-mono text-xs text-royal">{c.code}</span> {c.title}</span>
                        <StatusBadge status={c.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mb-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold">Department performance</p>
          <p className="text-xs text-slate-500">Response-time indicator: green ≤ 2 days, amber ≤ 5 days, red slower.</p>
        </div>
        {!stats ? <div className="p-5"><Skeleton className="h-32" /></div> : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.performance.map((d) => (
              <div key={d.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div><p className="text-3xl font-bold">{d.resolution_rate}%</p><p className="text-xs text-slate-500">resolution rate</p></div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-200" />
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${d.resolution_rate}%` }} /></div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 py-2"><dt className="text-slate-500">Received</dt><dd className="font-bold">{d.total}</dd></div>
                  <div className="rounded-lg bg-emerald-50 py-2"><dt className="text-emerald-700">Resolved</dt><dd className="font-bold">{d.resolved}</dd></div>
                  <div className="rounded-lg bg-amber-50 py-2"><dt className="text-amber-700">Pending</dt><dd className="font-bold">{d.pending}</dd></div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${speedTone(d.avg_resolution_hours)}`}><Timer className="h-3 w-3" /> Avg. {fmtHours(d.avg_resolution_hours)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700"><Star className="h-3 w-3" /> {d.avg_rating ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          {isSuper && <ChartCard title="Department comparison" subtitle="Complaints by status per department"><DepartmentBars data={stats.performance} /></ChartCard>}
          <ChartCard title="Category distribution" subtitle="Complaints per category"><CategoryBars data={stats.byCategory} /></ChartCard>
          <ChartCard title="Complaints over time" subtitle="Last 30 days" className={isSuper ? "lg:col-span-2" : ""}><TrendArea data={stats.trend} /></ChartCard>
        </div>
      )}
    </div>
  );
}
