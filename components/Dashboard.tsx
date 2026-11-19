"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Clock, Loader2, CheckCircle2, XCircle, PlusCircle, Inbox, Timer, Star, AlertTriangle, ArrowRight } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { api, StatCard, EmptyState, Skeleton, PageHeader, fmtHours } from "./ui";
import { ChartCard, StatusPie, CategoryBars, DepartmentBars, TrendArea } from "./Charts";
import { ComplaintTable, type ComplaintRow } from "./ComplaintTable";

type Stats = {
  totals: { total: number; pending: number; in_progress: number; resolved: number; rejected: number; urgent_open: number; avg_resolution_hours: number | null; avg_rating: number | null };
  byCategory: { name: string; value: number }[];
  trend: { date: string; submitted: number; resolved: number }[];
  performance: { id: number; name: string; total: number; pending: number; in_progress: number; resolved: number; rejected: number; resolution_rate: number; avg_resolution_hours: number | null; avg_rating: number | null }[];
};

export default function Dashboard({ user }: { user: SessionUser }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<ComplaintRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/api/stats").then(setStats).catch((e) => setError(e.message));
    api<{ complaints: ComplaintRow[] }>("/api/complaints?limit=6").then((d) => setRecent(d.complaints)).catch((e) => setError(e.message));
  }, []);

  const isStudent = user.role === "student";
  const isSuper = user.role === "super_admin";
  const t = stats?.totals;
  const title = isStudent ? `Hello, ${user.name.split(" ")[0]} 👋` : isSuper ? "University Overview" : user.department_name ?? "Department";
  const subtitle = isStudent
    ? "Here's where all your campus complaints stand."
    : isSuper
    ? "System-wide complaint activity across all departments."
    : "Complaints routed to your department.";

  if (error) return <div className="card p-6 text-sm text-red-700">Could not load dashboard: {error}</div>;

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={isStudent ? <Link href="/complaints/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> Submit Complaint</Link> :
          <Link href="/complaints" className="btn-dark">Manage complaints <ArrowRight className="h-4 w-4" /></Link>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {!t ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-2xl" />) : (
          <>
            <StatCard label="Total" value={t.total} icon={FileText} tone="navy" />
            <StatCard label="Pending" value={t.pending} icon={Clock} tone="amber" />
            <StatCard label="In Progress" value={t.in_progress} icon={Loader2} tone="blue" />
            <StatCard label="Resolved" value={t.resolved} icon={CheckCircle2} tone="green" />
            <StatCard label="Rejected" value={t.rejected} icon={XCircle} tone="red" />
          </>
        )}
      </div>

      {!isStudent && t && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
            <div><p className="text-xs text-slate-500">Open urgent complaints</p><p className="text-lg font-bold">{t.urgent_open}</p></div>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Timer className="h-5 w-5" /></span>
            <div><p className="text-xs text-slate-500">Average resolution time</p><p className="text-lg font-bold">{fmtHours(t.avg_resolution_hours)}</p></div>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600"><Star className="h-5 w-5" /></span>
            <div><p className="text-xs text-slate-500">Student satisfaction</p><p className="text-lg font-bold">{t.avg_rating ? `${t.avg_rating} / 5` : "No ratings yet"}</p></div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {stats ? (
          <>
            <ChartCard title="Status distribution" subtitle="Share of complaints by current status">
              <StatusPie data={[
                { name: "Pending", value: stats.totals.pending },
                { name: "In Progress", value: stats.totals.in_progress },
                { name: "Resolved", value: stats.totals.resolved },
                { name: "Rejected", value: stats.totals.rejected },
              ]} />
            </ChartCard>
            {isSuper ? (
              <ChartCard title="Complaints by department" subtitle="Received per department, split by status" className="lg:col-span-2">
                <DepartmentBars data={stats.performance} />
              </ChartCard>
            ) : (
              <ChartCard title="Complaint trend" subtitle="Submitted per day, last 30 days" className="lg:col-span-2">
                <TrendArea data={stats.trend} />
              </ChartCard>
            )}
            {isSuper && (
              <>
                <ChartCard title="Category distribution" subtitle="Complaints per official category">
                  <CategoryBars data={stats.byCategory} />
                </ChartCard>
                <ChartCard title="Complaint trend" subtitle="Submitted per day, last 30 days" className="lg:col-span-2">
                  <TrendArea data={stats.trend} />
                </ChartCard>
              </>
            )}
          </>
        ) : (
          <>
            <Skeleton className="h-[340px] rounded-2xl" />
            <Skeleton className="h-[340px] rounded-2xl lg:col-span-2" />
          </>
        )}
      </div>

      {isSuper && stats && (
        <div className="card mt-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-semibold">Department performance</p>
              <p className="text-xs text-slate-500">Resolution rate and speed, computed from live records</p>
            </div>
            <Link href="/insights" className="text-xs font-semibold text-royal hover:underline">Full insights →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-y border-slate-100 bg-slate-50/60 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5">Department</th><th className="px-3">Received</th><th className="px-3">Resolved</th><th className="px-3">Pending</th><th className="px-3 min-w-40">Resolution rate</th><th className="px-3">Avg. time</th>
              </tr></thead>
              <tbody>
                {stats.performance.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 font-medium">{d.name}</td>
                    <td className="px-3">{d.total}</td>
                    <td className="px-3 text-emerald-700">{d.resolved}</td>
                    <td className="px-3 text-amber-700">{d.pending}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${d.resolution_rate}%` }} /></div>
                        <span className="text-xs font-semibold">{d.resolution_rate}%</span>
                      </div>
                    </td>
                    <td className="px-3 text-slate-600">{fmtHours(d.avg_resolution_hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm font-semibold">{isStudent ? "Recent complaints" : "Recent incoming complaints"}</p>
          <Link href="/complaints" className="text-xs font-semibold text-royal hover:underline">View all →</Link>
        </div>
        {!recent ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : recent.length === 0 ? (
          <EmptyState icon={Inbox}
            title={isStudent ? "No complaints yet" : "No complaints received"}
            text={isStudent ? "When something on campus isn't right, report it here. We'll route it to the right department automatically." : "New complaints routed to you will appear here."}
            action={isStudent ? <Link href="/complaints/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> Submit your first complaint</Link> : undefined}
          />
        ) : (
          <ComplaintTable rows={recent} showStudent={!isStudent} showDepartment={isSuper || isStudent} />
        )}
      </div>
    </div>
  );
}
