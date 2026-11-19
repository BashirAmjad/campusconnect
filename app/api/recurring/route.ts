import { query } from "@/lib/db";
import { handler, json, requireUser, complaintScope, displayId } from "@/lib/api";

const STOP = new Set(
  "the a an and or of in on at to for is are was were be been it this that with from by as not no very too our my we i they there their have has had every all any some more most can cannot do does did into about after before during while out up down only also just than then so but if keeps keep again".split(" ")
);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((w) => w.replace(/(ing|ed|es|s)$/, ""))
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

function similarity(a: Set<string>, b: Set<string>) {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

/**
 * Recurring issue detection: groups complaints in the same category whose title+description
 * share enough keywords (Jaccard similarity). Complaints are only highlighted, never merged.
 */
export const GET = handler(async () => {
  const user = await requireUser("super_admin", "dept_admin");
  const p: unknown[] = [];
  const scope = complaintScope(user, p);
  const rows = await query<{ id: number; title: string; description: string; status: string; created_at: string; category_id: number; category_name: string; department_name: string }>(
    `SELECT c.id, c.title, c.description, c.status, c.created_at, c.category_id, cat.name AS category_name, d.name AS department_name
     FROM complaints c JOIN categories cat ON cat.id = c.category_id JOIN departments d ON d.id = c.department_id
     WHERE ${scope} AND c.created_at > now() - interval '90 days'
     ORDER BY c.created_at DESC LIMIT 500`,
    p
  );

  const items = rows.map((r) => ({ ...r, tk: tokens(`${r.title} ${r.title} ${r.description}`) }));
  const parent = items.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].category_id !== items[j].category_id) continue;
      if (similarity(items[i].tk, items[j].tk) >= 0.2) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, typeof items>();
  items.forEach((it, i) => {
    const r = find(i);
    groups.set(r, [...(groups.get(r) ?? []), it]);
  });

  const clusters = [...groups.values()]
    .filter((g) => g.length >= 2)
    .map((g) => {
      const freq = new Map<string, number>();
      g.forEach((it) => it.tk.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1)));
      const keywords = [...freq.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
      return {
        category_name: g[0].category_name,
        department_name: g[0].department_name,
        count: g.length,
        open: g.filter((x) => x.status === "Pending" || x.status === "In Progress").length,
        keywords,
        complaints: g.map(({ id, title, status, created_at }) => ({ id, code: displayId(id), title, status, created_at })),
      };
    })
    .sort((a, b) => b.count - a.count);

  return json({ clusters });
});
