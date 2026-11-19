import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getUser, type Role, type SessionUser } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Wraps a route handler with centralized error handling. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof ZodError) return json({ error: e.issues[0]?.message ?? "Invalid input", issues: e.issues }, 400);
      console.error(e);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

/** Authentication + role authorization middleware. */
export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getUser();
  if (!user) throw new HttpError(401, "Please sign in to continue");
  if (roles.length && !roles.includes(user.role)) throw new HttpError(403, "You do not have permission for this action");
  return user;
}

/**
 * Returns a SQL condition (on alias `c`) restricting complaints to what this user may see.
 * Enforced on every complaint query so URL/API tampering cannot cross department or student boundaries.
 */
export function complaintScope(user: SessionUser, params: unknown[]): string {
  if (user.role === "super_admin") return "TRUE";
  if (user.role === "dept_admin") {
    params.push(user.department_id);
    return `c.department_id = $${params.length}`;
  }
  params.push(user.id);
  return `c.student_id = $${params.length}`;
}

export const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"] as const;
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export function displayId(id: number) {
  return `CC-${String(id).padStart(5, "0")}`;
}

export function parseId(raw: string): number {
  const m = /^(?:CC-)?0*(\d+)$/i.exec(raw.trim());
  if (!m) throw new HttpError(404, "Complaint not found");
  return Number(m[1]);
}
