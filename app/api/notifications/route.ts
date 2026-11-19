import { z } from "zod";
import { query } from "@/lib/db";
import { handler, json, requireUser } from "@/lib/api";

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await query(
    `SELECT id, complaint_id, type, title, message, is_read, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [user.id]
  );
  const unread = rows.filter((r) => !r.is_read).length;
  return json({ notifications: rows, unread });
});

const schema = z.object({ id: z.number().int().positive().optional(), all: z.boolean().optional() });

export const PATCH = handler(async (req: Request) => {
  const user = await requireUser();
  const body = schema.parse(await req.json());
  if (body.all) await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [user.id]);
  else if (body.id) await query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = $2`, [user.id, body.id]);
  return json({ ok: true });
});
