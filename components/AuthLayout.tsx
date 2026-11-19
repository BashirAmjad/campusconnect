import { GraduationCap, Route, ShieldCheck, Activity, BellRing } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "./Theme";

const features = [
  { icon: Route, title: "Automatic complaint routing", text: "Every complaint reaches the right department instantly." },
  { icon: Activity, title: "Live complaint tracking", text: "Follow each step from submission to resolution." },
  { icon: BellRing, title: "Transparent communication", text: "Responses, remarks and status changes reach you instantly." },
  { icon: ShieldCheck, title: "Private & secure", text: "Role-based access keeps every department's data separate." },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-royal/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal to-blue-400 shadow-lg shadow-blue-900/50">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">CampusConnect</p>
            <p className="text-xs text-white/55">Smart Campus Complaint & Feedback Management</p>
          </div>
        </div>
        <div className="relative mt-auto mb-auto max-w-lg pt-16">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Your voice on campus, <span className="bg-gradient-to-r from-blue-300 to-sky-200 bg-clip-text text-transparent">heard and resolved.</span>
          </h1>
          <p className="mt-4 text-white/75">Report problems with the cafeteria, library, labs or teaching, and track them until they are fixed.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <Icon className="h-5 w-5 text-blue-300" />
                <p className="mt-2 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/45">BIIT Software Engineering Society · Application Development Competition</p>
      </div>
      <div className="relative flex items-center justify-center px-4 py-16 sm:px-8">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-royal text-white"><GraduationCap className="h-5 w-5" /></div>
            <p className="text-lg font-bold text-fg">CampusConnect</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
