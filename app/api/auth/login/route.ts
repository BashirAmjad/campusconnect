import bcrypt from "bcryptjs";
import { z } from "zod";
import { one } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { handler, json, HttpError } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const POST = handler(async (req: Request) => {
  const body = schema.parse(await req.json());
  const user = await one<{ id: number; password_hash: string; role: string }>(
    "SELECT id, password_hash, role FROM users WHERE email = $1",
    [body.email]
  );
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  await createSession(user.id);
  return json({ ok: true, role: user.role });
});
