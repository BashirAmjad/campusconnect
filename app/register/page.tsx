"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", registration_no: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match");
    setBusy(true);
    try {
      const { confirm: _c, ...payload } = form;
      await api("/api/auth/register", { method: "POST", json: payload });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your student account</h2>
      <p className="mt-1 text-sm text-slate-500">Register to submit and track campus complaints.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" value={form.name} onChange={set("name")} required minLength={2} placeholder="Ayesha Khan" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="email">University email</label>
            <input id="email" type="email" className="input" value={form.email} onChange={set("email")} required placeholder="you@student.edu" />
          </div>
          <div>
            <label className="label" htmlFor="reg">Registration no.</label>
            <input id="reg" className="input" value={form.registration_no} onChange={set("registration_no")} required placeholder="BIIT-22-123" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pw">Password</label>
            <input id="pw" type="password" className="input" value={form.password} onChange={set("password")} required minLength={8} placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="label" htmlFor="pw2">Confirm password</label>
            <input id="pw2" type="password" className="input" value={form.confirm} onChange={set("confirm")} required minLength={8} />
          </div>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create account
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered? <Link href="/login" className="font-semibold text-royal hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
