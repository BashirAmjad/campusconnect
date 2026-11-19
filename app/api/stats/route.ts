import { query } from "@/lib/db";
import { handler, json, requireUser, complaintScope } from "@/lib/api";

/** Dashboard statistics, always computed from live database records and scoped to the caller. */
export const GET = handler(async () => {
  const user = await requireUser();
  const p: unknown[] = [];
  const scope = complaintScope(user, p);

  const [totals] = await query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status='Pending')::int AS pending,
            count(*) FILTER (WHERE status='In Progress')::int AS in_progress,
            count(*) FILTER (WHERE status='Resolved')::int AS resolved,
            count(*) FILTER (WHERE status='Rejected')::int AS rejected,
            count(*) FILTER (WHERE priority='Urgent' AND status IN ('Pending','In Progress'))::int AS urgent_open,
            round(avg(EXTRACT(EPOCH FROM (closed_at - created_at))/3600) FILTER (WHERE status='Resolved')::numeric, 1)::float AS avg_resolution_hours,
            round(avg(rating)::numeric, 1)::float AS avg_rating
     FROM complaints c WHERE ${scope}`,
    p
  );

  const byCategory = await query(
    `SELECT cat.name, count(c.id)::int AS value
     FROM categories cat LEFT JOIN complaints c ON c.category_id = cat.id AND ${scope}
     GROUP BY cat.id, cat.name ORDER BY cat.id`,
    p
  );

  const trend = await query(
    `SELECT to_char(day, 'Mon DD') AS date,
            count(c.id)::int AS submitted,
            count(c.id) FILTER (WHERE c.status='Resolved')::int AS resolved
     FROM generate_series(current_date - 29, current_date, interval '1 day') AS day
     LEFT JOIN complaints c ON c.created_at::date = day::date AND ${scope}
     GROUP BY day ORDER BY day`,
    p
  );

  const byPriority = await query(
    `SELECT pr AS name, count(c.id)::int AS value
     FROM unnest(ARRAY['Low','Medium','High','Urgent']) AS pr
     LEFT JOIN complaints c ON c.priority = pr AND ${scope}
     GROUP BY pr ORDER BY array_position(ARRAY['Low','Medium','High','Urgent'], pr)`,
    p
  );

  const performance = await query(
    `SELECT d.id, d.name,
            count(c.id)::int AS total,
            count(c.id) FILTER (WHERE c.status='Pending')::int AS pending,
            count(c.id) FILTER (WHERE c.status='In Progress')::int AS in_progress,
            count(c.id) FILTER (WHERE c.status='Resolved')::int AS resolved,
            count(c.id) FILTER (WHERE c.status='Rejected')::int AS rejected,
            CASE WHEN count(c.id) = 0 THEN 0
                 ELSE round(100.0 * count(c.id) FILTER (WHERE c.status='Resolved') / count(c.id), 1)::float END AS resolution_rate,
            round(avg(EXTRACT(EPOCH FROM (c.closed_at - c.created_at))/3600) FILTER (WHERE c.status='Resolved')::numeric, 1)::float AS avg_resolution_hours,
            round(avg(c.rating)::numeric, 1)::float AS avg_rating
     FROM departments d LEFT JOIN complaints c ON c.department_id = d.id AND ${scope}
     ${user.role === "dept_admin" ? `WHERE d.id = ${Number(user.department_id)}` : ""}
     GROUP BY d.id, d.name ORDER BY d.id`,
    p
  );

  return json({ totals, byCategory, trend, byPriority, performance });
});
