import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
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

/** For server pages: returns the user or redirects to the login page. */
export async function pageUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/**
 * Resolves the signed-in user from the verified token. Role and department always come from the database.
 * Cached per request so the layout and page share one lookup.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  let id: number;
  try {
    const { payload } = await jwtVerify(token, secret());
    id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
  } catch {
    return null; // invalid or expired token
  }
  // Database errors propagate (500) instead of silently looking like a signed-out user.
  return one<SessionUser>(
    `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name AS department_name, u.registration_no
     FROM users u LEFT JOIN departments d ON d.id = u.department_id WHERE u.id = $1`,
    [id]
  );
});
