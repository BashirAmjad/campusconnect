import bcrypt from "bcryptjs";
import { z } from "zod";
import { one } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { handler, json, HttpError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  registration_no: z.string().trim().min(3, "Enter your registration number").max(40),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const POST = handler(async (req: Request) => {
  const body = schema.parse(await req.json());
  const exists = await one("SELECT id FROM users WHERE email = $1", [body.email]);
  if (exists) throw new HttpError(409, "An account with this email already exists");
  const hash = await bcrypt.hash(body.password, 10);
  // Registration always creates a student; admin roles cannot be self-assigned.
  const user = await one<{ id: number }>(
    `INSERT INTO users(name,email,password_hash,role,registration_no) VALUES ($1,$2,$3,'student',$4) RETURNING id`,
    [body.name, body.email, hash, body.registration_no]
  );
  await createSession(user!.id);
  return json({ ok: true }, 201);
});
