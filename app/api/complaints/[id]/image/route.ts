import { one } from "@/lib/db";
import { handler, requireUser, complaintScope, HttpError, parseId } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const id = parseId((await ctx.params).id);
  const params: unknown[] = [id];
  const scope = complaintScope(user, params);
  const row = await one<{ image_data: Buffer | null; image_mime: string | null }>(
    `SELECT c.image_data, c.image_mime FROM complaints c WHERE c.id = $1 AND ${scope}`,
    params
  );
  if (!row?.image_data) throw new HttpError(404, "Image not found");
  return new Response(new Uint8Array(row.image_data), {
    headers: {
      "Content-Type": row.image_mime ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
