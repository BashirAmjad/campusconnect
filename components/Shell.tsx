"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard, FileText, PlusCircle, Bell, Lightbulb, BarChart3, LogOut, Menu, X, GraduationCap, CheckCheck, Inbox,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { api, timeAgo } from "./ui";

type Notification = { id: number; complaint_id: number | null; title: string; message: string; is_read: boolean; created_at: string };

const ROLE_LABEL: Record<string, string> = { student: "Student", dept_admin: "Department Admin", super_admin: "Super Administrator" };

function navFor(user: SessionUser) {
  if (user.role === "student")
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/complaints/new", label: "Submit Complaint", icon: PlusCircle },
      { href: "/complaints", label: "My Complaints", icon: FileText },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/suggestions", label: "Anonymous Suggestions", icon: Lightbulb },
    ];
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/complaints", label: user.role === "super_admin" ? "All Complaints" : "Department Complaints", icon: FileText },
    { href: "/insights", label: user.role === "super_admin" ? "Insights & Recurring Issues" : "Department Insights", icon: BarChart3 },
    { href: "/suggestions", label: "Suggestions Inbox", icon: Lightbulb },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ];
}

export default function Shell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notes, setNotes] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const nav = navFor(user);

  const loadNotes = () =>
    api<{ notifications: Notification[]; unread: number }>("/api/notifications")
      .then((d) => { setNotes(d.notifications); setUnread(d.unread); })
      .catch(() => {});

  useEffect(() => {
    loadNotes();
    const t = setInterval(loadNotes, 20000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { setMobileOpen(false); setBellOpen(false); loadNotes(); }, [pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }
  async function markAll() {
    await api("/api/notifications", { method: "PATCH", json: { all: true } });
    loadNotes();
  }

  const isActive = (href: string) => (href === "/complaints" ? pathname === "/complaints" || (/^\/complaints\/(?!new)/.test(pathname)) : pathname === href || pathname.startsWith(href + "/"));
  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-navy text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-royal to-blue-400 text-white shadow-lg shadow-blue-900/40">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-tight text-white">CampusConnect</p>
          <p className="text-[11px] text-slate-400">Complaint & Feedback Hub</p>
        </div>
      </div>
      <div className="mx-4 mb-3 rounded-xl bg-white/5 px-3 py-2 text-xs">
        <p className="text-slate-400">Signed in as</p>
        <p className="font-semibold text-white">{ROLE_LABEL[user.role]}</p>
        {user.department_name && <p className="mt-0.5 text-blue-300">{user.department_name}</p>}
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`}>
              <Icon className={`h-[18px] w-[18px] ${active ? "text-blue-300" : "text-slate-400 group-hover:text-slate-200"}`} />
              <span className="flex-1">{label}</span>
              {href === "/notifications" && unread > 0 && <span className="rounded-full bg-royal px-1.5 text-[11px] font-bold text-white">{unread}</span>}
            </Link>
          );
        })}
      </nav>
      <button onClick={logout} className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white">
        <LogOut className="h-[18px] w-[18px]" /> Sign out
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{Sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-64 animate-fade-up">{Sidebar}</div>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-900">{user.name.split(" ")[0]}</span></p>
          </div>
          <div className="relative" ref={bellRef}>
            <button onClick={() => setBellOpen((o) => !o)} className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread}</span>}
            </button>
            {bellOpen && (
              <div className="card animate-fade-up absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unread > 0 && <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-royal hover:underline"><CheckCheck className="h-3.5 w-3.5" /> Mark all read</button>}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notes.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center text-sm text-slate-500"><Inbox className="mb-2 h-6 w-6 text-slate-300" />You're all caught up</div>
                  ) : notes.slice(0, 8).map((n) => (
                    <Link key={n.id} href={n.complaint_id ? `/complaints/${n.complaint_id}` : "/notifications"}
                      onClick={() => !n.is_read && api("/api/notifications", { method: "PATCH", json: { id: n.id } })}
                      className={`block border-b border-slate-50 px-4 py-3 hover:bg-slate-50 ${n.is_read ? "" : "bg-blue-50/50"}`}>
                      <div className="flex items-start gap-2">
                        {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-royal" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="line-clamp-2 text-xs text-slate-500">{n.message}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/notifications" className="block bg-slate-50 py-2.5 text-center text-xs font-semibold text-royal hover:bg-slate-100">View all notifications</Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-navy to-royal text-xs font-bold text-white">{initials}</div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.registration_no ?? user.email}</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
