# CampusConnect — Demo Script & Talking Points

Live app: https://campusconnect-t29b.vercel.app
Repository: https://github.com/BashirAmjad/campusconnect

Demo accounts share the seed password set by the team (not stored in this repo).

## 7-minute demo flow

1. **Open the public URL** → sign-in page. Point out one login for all three roles; the role is decided by the server.
2. **Student** (`ayesha@student.edu`, or register a new account live) → personalised dashboard: counters, status chart, recent complaints, bell icon.
3. **Submit Complaint** → choose *Cafeteria*. The green banner shows the complaint *will be routed to Cafeteria Administration* — the student never picks a department. Add a title, description and a photo → submit.
4. The complaint page opens with its ID (e.g. `CC-00014`), the **tracking timeline** (Submitted → Under Review → In Progress → Resolved) and the activity history.
5. **Sign out → Cafeteria Admin** (`cafeteria@campusconnect.edu`) → new complaint is in *Recent incoming complaints*, the bell shows a notification. Open it, view the photo.
6. Set **priority = High**, **status = In Progress**, write a **response** → Save. Then set **Resolved** with remarks (confirmation dialog). Mention that *Rejected* requires a reason — the API refuses it otherwise.
7. **Back to the student** → bell shows the status change and response, timeline is complete, student leaves a **5-star satisfaction rating**.
8. **Super Admin** (`superadmin@campusconnect.edu`) → university-wide counters, department comparison bar chart, status doughnut, category distribution, 30-day trend, department performance table (resolution %, average resolution time).
9. **All Complaints** → search by ID `CC-00014`, filter by department / status / category / date, **Export CSV**.
10. **Access control demo**: sign in as **Library Admin** and paste the cafeteria complaint URL → *"Complaint not available"*. The API returns 404 because the SQL query itself is restricted to the library department.
11. **Insights & Recurring Issues** → clusters of similar complaints (e.g. Block B internet drops, cafeteria hygiene) with shared keywords; highlighted, never merged.
12. **Anonymous Suggestions** (student) → stored without any user reference; visible in the admins' Suggestions Inbox.

## Talking points

- **Architecture**: one Next.js app on Vercel — React UI + REST API route handlers (serverless Node functions) → Neon PostgreSQL over a pooled TLS connection. One deployment, auto-deploys on every push to `main`.
- **Stack**: React 19, TypeScript, Tailwind CSS 4, Recharts, Lucide icons, Zod validation, `pg`, `jose` JWT, `bcryptjs`.
- **Database**: 7 normalised tables — departments, categories (→ department), users, complaints, complaint_history, notifications, feedback — with foreign keys, CHECK constraints for status/priority/roles, and indexes on department+status, student, category and date. Versioned SQL migrations + idempotent seed script.
- **Authentication**: bcrypt-hashed passwords; signed JWT in an httpOnly, SameSite=Lax, Secure cookie (8h). The token holds only the user id — role and department are re-read from the database on every request, so the frontend can't spoof them.
- **Authorization**: `requireUser(roles)` middleware for role checks; `complaintScope(user)` adds the student/department filter to *every* complaint query (list, details, update, image, stats, recurring). Out-of-scope IDs return 404 so existence isn't leaked.
- **Automatic routing**: the category → department mapping lives in the `categories` table; the API copies the department from it on insert.
- **Uploads**: images ≤ 2 MB, JPG/PNG/WEBP/GIF, verified by file signature (magic bytes), stored in Postgres and served only through the access-checked endpoint.
- **Analytics**: all numbers come from SQL aggregates on live data (FILTER clauses, generate_series for the 30-day trend, average resolution time from closed_at − created_at).
- **Recurring issue detection**: keyword extraction (stop-words, stemming, synonym normalisation) + Jaccard similarity within the same category, grouped with union-find.
- **Innovation list**: tracking timeline, priority system, anonymous suggestions, smart search, notification center, recurring issue detection, performance insights with response-time indicators, satisfaction ratings, CSV export, printable complaint report, empty states, responsive mobile navigation.

## Known limitations

- Notifications are in-app (polled every 20 s), not email/push.
- Images are stored in the database (fine for 2 MB limit; object storage would be the next step at scale).
- No password-reset flow yet.
