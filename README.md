# CampusConnect — Smart Campus Complaint & Feedback Management System

A full-stack web app where students report campus problems, complaints are routed automatically to the responsible department, departmental administrators resolve them, and a Super Administrator monitors the whole university with live analytics.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide icons, Recharts |
| Backend | Next.js Route Handlers (REST API, Node.js runtime) |
| Database | PostgreSQL on Neon (hosted), `pg` driver with connection pooling |
| Auth | Signed JWT (HS256, `jose`) in an httpOnly, SameSite cookie; bcrypt password hashing |
| Validation | Zod on every API input |
| Hosting | Vercel (frontend + API in one deployment), auto-deploy from GitHub |

## Architecture

```
Browser (React UI)  ──fetch──▶  /api/* route handlers  ──pg pool──▶  Neon PostgreSQL
                                   │
                                   ├─ requireUser(): verifies JWT, loads role & department from DB
                                   └─ complaintScope(): SQL filter added to EVERY complaint query
```

* **Role & department are never trusted from the client.** The session token only carries the user id; the role and department are read from the database on each request.
* **Department isolation is enforced in SQL**: department admins only ever query `department_id = <their department>`, students `student_id = <their id>`. Requests for other complaints return 404, so even manual URL or API tampering cannot cross departments.
* **Automatic routing**: the `categories` table maps each category to its department; the API sets `department_id` from that mapping. Students never choose a department.

## Database schema

`departments`, `categories` (→ department), `users` (role, department), `complaints` (→ student, category, department; status, priority, response, remarks, image, rating, timestamps), `complaint_history` (every action / status change), `notifications`, `feedback` (anonymous — no user reference stored). See `db/migrations/001_init.sql`.

## API overview

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/register` | public | Student registration |
| `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | — | Session management |
| `GET /api/complaints` | all (scoped) | List / search / filter (`q`, `status`, `priority`, `category`, `department`, `from`, `to`) |
| `POST /api/complaints` | student | Submit (multipart, optional image ≤ 2 MB, type + signature checked) |
| `GET /api/complaints/:id` | scoped | Details + full activity history |
| `PATCH /api/complaints/:id` | dept admin / super admin (scoped) | Status, priority, response, remarks (rejection requires reason) |
| `GET /api/complaints/:id/image` | scoped | Attachment |
| `POST /api/complaints/:id/rate` | owner student | Satisfaction rating after resolution |
| `GET/PATCH /api/notifications` | self | Notification center |
| `GET /api/stats` | scoped | Dashboard statistics & chart data |
| `GET /api/recurring` | admins (scoped) | Recurring issue detection |
| `GET/POST /api/feedback` | admins / student | Anonymous suggestions |

## Innovative features

Smart tracking timeline · priority system (Low → Urgent) · anonymous suggestions · smart search & filters · notification center · recurring issue detection (keyword similarity within a category, highlighted, never merged) · department performance insights with response-time indicators · student satisfaction ratings · CSV export & printable complaint report · professional empty states · responsive mobile navigation.

## Running locally

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, SEED_PASSWORD
npm run db:migrate
npm run db:seed
npm run dev
```

Seeded accounts (password = the `SEED_PASSWORD` you set):

| Role | Email |
|---|---|
| Super Administrator | superadmin@campusconnect.edu |
| Cafeteria Admin | cafeteria@campusconnect.edu |
| Library Admin | library@campusconnect.edu |
| Lab / IT Admin | labit@campusconnect.edu |
| Academic Coordinator | academic@campusconnect.edu |
| Demo students | ayesha@student.edu, hamza@student.edu |

## Deployment

1. Push to GitHub. 2. Import the repo in Vercel (framework: Next.js, defaults). 3. Add `DATABASE_URL` and `JWT_SECRET` environment variables. 4. Run `npm run db:migrate && npm run db:seed` once against the Neon database. Every push to `main` redeploys automatically.
