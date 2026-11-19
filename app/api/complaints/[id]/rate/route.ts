import { z } from "zod";
import { one, query } from "@/lib/db";
import { handler, json, requireUser, HttpError, parseId } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

/** Student satisfaction rating after a complaint is resolved. */
export const POST = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireUser("student");
  const id = parseId((await ctx.params).id);
  const body = schema.parse(await req.json());
  const c = await one<{ status: string; rating: number | null }>(
    `SELECT status, rating FROM complaints WHERE id = $1 AND student_id = $2`,
    [id, user.id]
  );
  if (!c) throw new HttpError(404, "Complaint not found");
  if (c.status !== "Resolved") throw new HttpError(400, "You can rate a complaint only after it is resolved");
  if (c.rating) throw new HttpError(409, "You have already rated this complaint");
  await query(`UPDATE complaints SET rating = $1, rating_comment = $2 WHERE id = $3`, [body.rating, body.comment || null, id]);
  await query(
    `INSERT INTO complaint_history(complaint_id, actor_id, action, note) VALUES ($1,$2,'Rated',$3)`,
    [id, user.id, `Student rated the resolution ${body.rating}/5${body.comment ? `: ${body.comment}` : ""}`]
  );
  return json({ ok: true });
});
