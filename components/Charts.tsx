"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import type { ReactNode } from "react";
import { useIsDark } from "./Theme";

export const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  "In Progress": "#2563eb",
  Resolved: "#10b981",
  Rejected: "#ef4444",
};
function usePal() {
  const dark = useIsDark();
  return dark
    ? { grid: "#243049", tick: "#94a3b8", tickStrong: "#cbd5e1", cursor: "rgba(148,163,184,0.08)", cats: ["#3b82f6", "#a78bfa", "#38bdf8", "#34d399"],
        tooltip: { borderRadius: 12, border: "1px solid #334155", background: "#1e293b", color: "#f8fafc", boxShadow: "0 8px 24px -12px rgba(0,0,0,.6)", fontSize: 12 }, legend: "#cbd5e1" }
    : { grid: "#f1f5f9", tick: "#64748b", tickStrong: "#334155", cursor: "#f8fafc", cats: ["#2563eb", "#14213d", "#0ea5e9", "#6366f1"],
        tooltip: { borderRadius: 12, border: "1px solid #e2e8f0", background: "#ffffff", color: "#0f172a", boxShadow: "0 8px 24px -12px rgba(15,23,42,.25)", fontSize: 12 }, legend: "#334155" };
}

export function ChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`card animate-fade-up p-5 ${className}`}>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4 h-64">{children}</div>
    </div>
  );
}

function NoData() {
  return <div className="grid h-full place-items-center text-sm text-slate-400">No complaints recorded yet</div>;
}

export function StatusPie({ data }: { data: { name: string; value: number }[] }) {
  const pal = usePal();
  const filtered = data.filter((d) => d.value > 0);
  if (!filtered.length) return <NoData />;
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={3} strokeWidth={0}>
          {filtered.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? "#94a3b8"} />)}
        </Pie>
        <Tooltip contentStyle={pal.tooltip} itemStyle={{ color: pal.tooltip.color }} labelStyle={{ color: pal.tooltip.color }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: pal.legend }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ data }: { data: { name: string; value: number }[] }) {
  const pal = usePal();
  if (!data.some((d) => d.value > 0)) return <NoData />;
  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
        <CartesianGrid horizontal={false} stroke={pal.grid} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: pal.tick }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: pal.tickStrong }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={pal.tooltip} itemStyle={{ color: pal.tooltip.color }} labelStyle={{ color: pal.tooltip.color }} cursor={{ fill: pal.cursor }} />
        <Bar dataKey="value" name="Complaints" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((d, i) => <Cell key={d.name} fill={pal.cats[i % pal.cats.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DepartmentBars({ data }: { data: { name: string; pending: number; in_progress: number; resolved: number; rejected: number }[] }) {
  const pal = usePal();
  if (!data.some((d) => d.pending + d.in_progress + d.resolved + d.rejected > 0)) return <NoData />;
  const SHORT: Record<string, string> = {
    "Cafeteria Administration": "Cafeteria",
    "Library Administration": "Library",
    "Laboratory / IT Administration": "Lab / IT",
    "Teaching / Academic Coordination": "Academic",
  };
  const short = data.map((d) => ({ ...d, short: SHORT[d.name] ?? d.name }));
  return (
    <ResponsiveContainer>
      <BarChart data={short} margin={{ right: 8 }}>
        <CartesianGrid vertical={false} stroke={pal.grid} />
        <XAxis dataKey="short" tick={{ fontSize: 11, fill: pal.tickStrong }} axisLine={false} tickLine={false} interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: pal.tick }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={pal.tooltip} itemStyle={{ color: pal.tooltip.color }} labelStyle={{ color: pal.tooltip.color }} cursor={{ fill: pal.cursor }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: pal.legend }} />
        <Bar dataKey="pending" name="Pending" stackId="a" fill={STATUS_COLORS.Pending} />
        <Bar dataKey="in_progress" name="In Progress" stackId="a" fill={STATUS_COLORS["In Progress"]} />
        <Bar dataKey="resolved" name="Resolved" stackId="a" fill={STATUS_COLORS.Resolved} />
        <Bar dataKey="rejected" name="Rejected" stackId="a" fill={STATUS_COLORS.Rejected} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({ data }: { data: { date: string; submitted: number; resolved: number }[] }) {
  const pal = usePal();
  return (
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ right: 8 }}>
        <defs>
          <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
          <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={pal.grid} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: pal.tick }} axisLine={false} tickLine={false} interval={4} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: pal.tick }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={pal.tooltip} itemStyle={{ color: pal.tooltip.color }} labelStyle={{ color: pal.tooltip.color }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: pal.legend }} />
        <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#2563eb" strokeWidth={2} fill="url(#gSub)" />
        <Area type="monotone" dataKey="resolved" name="Since resolved" stroke="#10b981" strokeWidth={2} fill="url(#gRes)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
