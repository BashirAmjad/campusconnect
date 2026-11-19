import { z } from "zod";
import { query } from "@/lib/db";
import { handler, json, requireUser } from "@/lib/api";

const schema = z.object({
  category_id: z.number().int().positive().nullable().optional(),
  message: z.string().trim().min(10, "Suggestion must be at least 10 characters").max(2000),
});

/** Anonymous suggestions: the submitter must be signed in, but their identity is never stored. */
export const POST = handler(async (req: Request) => {
  await requireUser("student");
  const body = schema.parse(await req.json());
  await query(`INSERT INTO feedback(category_id, message) VALUES ($1,$2)`, [body.category_id ?? null, body.message]);
  return json({ ok: true }, 201);
});

export const GET = handler(async () => {
  const user = await requireUser("super_admin", "dept_admin");
  const params: unknown[] = [];
  let where = "TRUE";
  if (user.role === "dept_admin") {
    params.push(user.department_id);
    where = `cat.department_id = $1`;
  }
  const rows = await query(
    `SELECT f.id, f.message, f.created_at, cat.name AS category_name
     FROM feedback f LEFT JOIN categories cat ON cat.id = f.category_id
     WHERE ${where} ORDER BY f.created_at DESC LIMIT 200`,
    params
  );
  return json({ feedback: rows });
});
