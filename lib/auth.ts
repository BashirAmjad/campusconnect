import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { one } from "./db";

export type Role = "student" | "dept_admin" | "super_admin";
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  department_id: number | null;
  department_name: string | null;
  registration_no: string | null;
}

export const COOKIE = "cc_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: number) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Resolves the signed-in user from the verified token. Role and department always come from the database. */
export async function getUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    return await one<SessionUser>(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name, u.registration_no
       FROM users u LEFT JOIN departments d ON d.id = u.department_id WHERE u.id = $1`,
      [id]
    );
  } catch {
    return null;
  }
}
