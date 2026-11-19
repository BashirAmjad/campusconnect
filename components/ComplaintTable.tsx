"use client";

import Link from "next/link";
import { ImageIcon, ChevronRight } from "lucide-react";
import { StatusBadge, PriorityBadge, fmtDate, timeAgo } from "./ui";

export type ComplaintRow = {
  id: number; code: string; title: string; status: string; priority: string; created_at: string; updated_at: string;
  category_name: string; department_name: string; student_name: string; has_image: boolean;
};

export function ComplaintTable({ rows, showStudent, showDepartment = true }: { rows: ComplaintRow[]; showStudent?: boolean; showDepartment?: boolean }) {
  return (
    <>
      {/* desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-semibold">Complaint</th>
              <th className="px-3 py-3 font-semibold">Category</th>
              {showDepartment && <th className="px-3 py-3 font-semibold">Department</th>}
              {showStudent && <th className="px-3 py-3 font-semibold">Student</th>}
              <th className="px-3 py-3 font-semibold">Priority</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Submitted</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="group border-b border-slate-50 transition hover:bg-slate-50/80">
                <td className="max-w-xs px-5 py-3.5">
                  <Link href={`/complaints/${c.id}`} className="block">
                    <span className="font-mono text-xs font-semibold text-royal">{c.code}</span>
                    <p className="flex items-center gap-1.5 truncate font-medium text-slate-900">
                      {c.title} {c.has_image && <ImageIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                    </p>
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-slate-600">{c.category_name}</td>
                {showDepartment && <td className="px-3 py-3.5 text-slate-600">{c.department_name}</td>}
                {showStudent && <td className="px-3 py-3.5 text-slate-600">{c.student_name}</td>}
                <td className="px-3 py-3.5"><PriorityBadge priority={c.priority} /></td>
                <td className="px-3 py-3.5"><StatusBadge status={c.status} /></td>
                <td className="whitespace-nowrap px-3 py-3.5 text-slate-500" title={fmtDate(c.created_at)}>{timeAgo(c.created_at)}</td>
                <td className="px-3 py-3.5">
                  <Link href={`/complaints/${c.id}`} className="text-slate-300 group-hover:text-royal"><ChevronRight className="h-4 w-4" /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* mobile cards */}
      <div className="divide-y divide-slate-100 md:hidden">
        {rows.map((c) => (
          <Link key={c.id} href={`/complaints/${c.id}`} className="block px-4 py-3.5 hover:bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-royal">{c.code}</span>
              <StatusBadge status={c.status} />
            </div>
            <p className="mt-1 font-medium text-slate-900">{c.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <PriorityBadge priority={c.priority} /> <span>{c.category_name}</span> <span>· {timeAgo(c.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
