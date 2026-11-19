"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/login", { method: "POST", json: { email, password } });
      window.location.assign("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h2>
      <p className="mt-1 text-sm text-slate-500">Students, department administrators and the super administrator all sign in here.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" placeholder="you@student.edu" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative"><input id="password" type={show ? "text" : "password"} className="input pr-11" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Sign in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New student? <Link href="/register" className="font-semibold text-royal hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
