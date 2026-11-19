"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "cc-theme";

/** Runs in <head> before paint so the correct theme shows with no flash. */
export const themeScript = `(function(){try{var p=localStorage.getItem('${KEY}')||'system';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

function apply(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("dark", dark);
  window.setTimeout(() => root.classList.remove("theme-transition"), 250);
  window.dispatchEvent(new Event("cc-theme-change"));
}

/** Current resolved theme (for charts that need concrete colors). */
export function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();
    window.addEventListener("cc-theme-change", read);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    return () => { window.removeEventListener("cc-theme-change", read); mq.removeEventListener("change", read); };
  }, []);
  return dark;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    try { setPref((localStorage.getItem(KEY) as ThemePref) || "system"); } catch {}
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onOs = () => { let p: ThemePref = "system"; try { p = (localStorage.getItem(KEY) as ThemePref) || "system"; } catch {} if (p === "system") apply("system"); };
    mq.addEventListener("change", onOs);
    return () => mq.removeEventListener("change", onOs);
  }, []);
  const choose = (p: ThemePref) => {
    setPref(p);
    try { localStorage.setItem(KEY, p); } catch {}
    apply(p);
  };
  const opts: { v: ThemePref; label: string; icon: typeof Sun }[] = [
    { v: "light", label: "Light", icon: Sun },
    { v: "dark", label: "Dark", icon: Moon },
    { v: "system", label: "System", icon: Monitor },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-sm">
      {opts.map(({ v, label, icon: Icon }) => (
        <button key={v} type="button" role="radio" aria-checked={pref === v} title={`${label} theme`} onClick={() => choose(v)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${pref === v ? "bg-royal text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
          <Icon className="h-3.5 w-3.5" />{!compact && label}
        </button>
      ))}
    </div>
  );
}
