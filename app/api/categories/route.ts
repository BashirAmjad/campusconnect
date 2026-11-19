import { query } from "@/lib/db";
import { handler, json, requireUser } from "@/lib/api";

export const GET = handler(async () => {
  await requireUser();
  const rows = await query(
    `SELECT c.id, c.code, c.name, c.description, d.id AS department_id, d.name AS department_name
     FROM categories c JOIN departments d ON d.id = c.department_id ORDER BY c.id`
  );
  const departments = await query(`SELECT id, code, name FROM departments ORDER BY id`);
  return json({ categories: rows, departments });
});
