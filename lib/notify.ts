import type { PoolClient } from "pg";

type Q = Pick<PoolClient, "query">;

export async function notify(db: Q, userId: number, complaintId: number | null, type: string, title: string, message: string) {
  await db.query(
    `INSERT INTO notifications(user_id, complaint_id, type, title, message) VALUES ($1,$2,$3,$4,$5)`,
    [userId, complaintId, type, title, message]
  );
}

export async function notifyDepartment(db: Q, departmentId: number, complaintId: number, type: string, title: string, message: string) {
  await db.query(
    `INSERT INTO notifications(user_id, complaint_id, type, title, message)
     SELECT id, $2, $3, $4, $5 FROM users WHERE role = 'dept_admin' AND department_id = $1`,
    [departmentId, complaintId, type, title, message]
  );
}
