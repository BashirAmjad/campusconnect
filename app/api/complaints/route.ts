import { z } from "zod";
import { pool, query, one } from "@/lib/db";
import { handler, json, requireUser, complaintScope, HttpError, displayId, STATUSES, PRIORITIES } from "@/lib/api";
import { notify, notifyDepartment } from "@/lib/notify";

const MAX_IMAGE = 2 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const sp = new URL(req.url).searchParams;
  const params: unknown[] = [];
  const where = [complaintScope(user, params)];

  const q = sp.get("q")?.trim();
  if (q) {
    const idMatch = /^(?:CC-)?0*(\d+)$/i.exec(q);
    params.push(`%${q}%`);
    const p = `$${params.length}`;
    let cond = `(c.title ILIKE ${p} OR c.description ILIKE ${p} OR cat.name ILIKE ${p} OR d.name ILIKE ${p} OR u.name ILIKE ${p})`;
    if (idMatch) {
      params.push(Number(idMatch[1]));
      cond = `(${cond} OR c.id = $${params.length})`;
    }
    where.push(cond);
  }
  const status = sp.get("status");
  if (status && (STATUSES as readonly string[]).includes(status)) { params.push(status); where.push(`c.status = $${params.length}`); }
  const priority = sp.get("priority");
  if (priority && (PRIORITIES as readonly string[]).includes(priority)) { params.push(priority); where.push(`c.priority = $${params.length}`); }
  const category = Number(sp.get("category"));
  if (category) { params.push(category); where.push(`c.category_id = $${params.length}`); }
  const department = Number(sp.get("department"));
  if (department) { params.push(department); where.push(`c.department_id = $${params.length}`); }
  const from = sp.get("from");
  if (from && !isNaN(Date.parse(from))) { params.push(from); where.push(`c.created_at >= $${params.length}::date`); }
  const to = sp.get("to");
  if (to && !isNaN(Date.parse(to))) { params.push(to); where.push(`c.created_at < ($${params.length}::date + 1)`); }
  const limit = Math.min(Number(sp.get("limit")) || 200, 500);

  const rows = await query(
    `SELECT c.id, c.title, c.status, c.priority, c.created_at, c.updated_at, c.closed_at,
            c.category_id, cat.name AS category_name, c.department_id, d.name AS department_name,
            u.name AS student_name, (c.image_data IS NOT NULL) AS has_image, c.rating
     FROM complaints c
     JOIN categories cat ON cat.id = c.category_id
     JOIN departments d ON d.id = c.department_id
     JOIN users u ON u.id = c.student_id
     WHERE ${where.join(" AND ")}
     ORDER BY c.created_at DESC LIMIT ${limit}`,
    params
  );
  return json({ complaints: rows.map((r) => ({ ...r, code: displayId(r.id) })) });
});

const createSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(150, "Title is too long"),
  description: z.string().trim().min(15, "Please describe the problem in at least 15 characters").max(5000),
  category_id: z.coerce.number().int().positive("Select a category"),
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser("student");
  const form = await req.formData();
  const body = createSchema.parse({
    title: form.get("title"),
    description: form.get("description"),
    category_id: form.get("category_id"),
  });

  let image: Buffer | null = null;
  let mime: string | null = null;
  const file = form.get("image");
  if (file && typeof file !== "string" && file.size > 0) {
    if (!IMAGE_TYPES.includes(file.type)) throw new HttpError(400, "Only JPG, PNG, WEBP or GIF images are allowed");
    if (file.size > MAX_IMAGE) throw new HttpError(400, "Image must be 2 MB or smaller");
    image = Buffer.from(await file.arrayBuffer());
    // Check the file signature, not just the type the browser claims.
    const sig = image.subarray(0, 4).toString("hex");
    const valid = sig.startsWith("ffd8") || sig === "89504e47" || sig === "47494638" || image.subarray(8, 12).toString() === "WEBP";
    if (!valid) throw new HttpError(400, "The uploaded file is not a valid image");
    mime = file.type;
  }

  // Automatic routing: the department comes from the central category -> department mapping.
  const cat = await one<{ id: number; name: string; department_id: number; department_name: string }>(
    `SELECT c.id, c.name, c.department_id, d.name AS department_name
     FROM categories c JOIN departments d ON d.id = c.department_id WHERE c.id = $1`,
    [body.category_id]
  );
  if (!cat) throw new HttpError(400, "Invalid category");

  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const { rows: [c] } = await client.query(
      `INSERT INTO complaints(student_id, category_id, department_id, title, description, image_data, image_mime)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [user.id, cat.id, cat.department_id, body.title, body.description, image, mime]
    );
    const code = displayId(c.id);
    await client.query(
      `INSERT INTO complaint_history(complaint_id, actor_id, action, to_status, note) VALUES ($1,$2,'Submitted','Pending',$3)`,
      [c.id, user.id, `Complaint submitted and automatically routed to ${cat.department_name}`]
    );
    await notify(client, user.id, c.id, "submitted", `Complaint ${code} submitted`, `Your complaint "${body.title}" was routed to ${cat.department_name}.`);
    await notifyDepartment(client, cat.department_id, c.id, "new", `New complaint ${code}`, `${user.name} reported: "${body.title}"`);
    await client.query("COMMIT");
    return json({ id: c.id, code, department: cat.department_name }, 201);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
