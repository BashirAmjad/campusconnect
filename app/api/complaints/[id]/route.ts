import { z } from "zod";
import { pool, query, one } from "@/lib/db";
import { handler, json, requireUser, complaintScope, HttpError, displayId, parseId, STATUSES, PRIORITIES } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

type Ctx = { params: Promise<{ id: string }> };

/** Loads a complaint only if it is inside the user's scope; otherwise 404 (no existence leak). */
async function loadScoped(user: SessionUser, id: number) {
  const params: unknown[] = [id];
  const scope = complaintScope(user, params);
  const c = await one(
    `SELECT c.id, c.title, c.description, c.status, c.priority, c.admin_response, c.resolution_remarks,
            c.created_at, c.updated_at, c.closed_at, c.rating, c.rating_comment, c.student_id,
            c.category_id, cat.name AS category_name, c.department_id, d.name AS department_name,
            u.name AS student_name, u.email AS student_email, u.registration_no,
            (c.image_data IS NOT NULL) AS has_image
     FROM complaints c
     JOIN categories cat ON cat.id = c.category_id
     JOIN departments d ON d.id = c.department_id
     JOIN users u ON u.id = c.student_id
     WHERE c.id = $1 AND ${scope}`,
    params
  );
  if (!c) throw new HttpError(404, "Complaint not found");
  return c;
}

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const id = parseId((await ctx.params).id);
  const complaint = await loadScoped(user, id);
  const history = await query(
    `SELECT h.id, h.action, h.from_status, h.to_status, h.note, h.created_at, u.name AS actor_name, u.role AS actor_role
     FROM complaint_history h LEFT JOIN users u ON u.id = h.actor_id
     WHERE h.complaint_id = $1 ORDER BY h.created_at ASC, h.id ASC`,
    [id]
  );
  if (user.role === "student") {
    delete (complaint as Record<string, unknown>).student_email;
  }
  return json({ complaint: { ...complaint, code: displayId(id) }, history });
});

const updateSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    response: z.string().trim().max(3000).optional(),
    remarks: z.string().trim().max(3000).optional(),
  })
  .refine((b) => b.status || b.priority || b.response || b.remarks, { message: "Nothing to update" })
  .refine((b) => b.status !== "Rejected" || (b.remarks && b.remarks.length >= 5), {
    message: "Please provide a reason (at least 5 characters) when rejecting a complaint",
  });

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireUser("dept_admin", "super_admin");
  const id = parseId((await ctx.params).id);
  const current = await loadScoped(user, id);
  const body = updateSchema.parse(await req.json());
  const code = displayId(id);

  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const sets: string[] = ["updated_at = now()"];
    const vals: unknown[] = [];
    const add = (sql: string, v: unknown) => { vals.push(v); sets.push(`${sql} = $${vals.length}`); };

    if (body.priority && body.priority !== current.priority) {
      add("priority", body.priority);
      await client.query(
        `INSERT INTO complaint_history(complaint_id, actor_id, action, note) VALUES ($1,$2,'Priority Changed',$3)`,
        [id, user.id, `Priority changed from ${current.priority} to ${body.priority}`]
      );
    }
    if (body.response) {
      add("admin_response", body.response);
      await client.query(
        `INSERT INTO complaint_history(complaint_id, actor_id, action, note) VALUES ($1,$2,'Response Added',$3)`,
        [id, user.id, body.response]
      );
      await notify(client, current.student_id, id, "response", `New response on ${code}`, body.response.slice(0, 200));
    }
    if (body.remarks) add("resolution_remarks", body.remarks);
    if (body.status && body.status !== current.status) {
      add("status", body.status);
      if (body.status === "Resolved" || body.status === "Rejected") sets.push("closed_at = now()");
      else sets.push("closed_at = NULL");
      await client.query(
        `INSERT INTO complaint_history(complaint_id, actor_id, action, from_status, to_status, note) VALUES ($1,$2,'Status Changed',$3,$4,$5)`,
        [id, user.id, current.status, body.status, body.remarks || null]
      );
      const msg =
        body.status === "Resolved" ? `Your complaint "${current.title}" has been resolved.` :
        body.status === "Rejected" ? `Your complaint "${current.title}" was rejected. Reason: ${body.remarks}` :
        `Your complaint "${current.title}" is now ${body.status}.`;
      await notify(client, current.student_id, id, body.status.toLowerCase().replace(" ", "_"), `${code} is now ${body.status}`, msg);
    } else if (body.remarks && !body.status) {
      await client.query(
        `INSERT INTO complaint_history(complaint_id, actor_id, action, note) VALUES ($1,$2,'Remark Added',$3)`,
        [id, user.id, body.remarks]
      );
    }
    vals.push(id);
    await client.query(`UPDATE complaints SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return json({ ok: true });
});
