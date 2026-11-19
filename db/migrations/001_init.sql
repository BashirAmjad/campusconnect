-- CampusConnect initial schema

CREATE TABLE IF NOT EXISTS departments (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(32)  NOT NULL UNIQUE,
  name        VARCHAR(120) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(32)  NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  description   TEXT,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('student','dept_admin','super_admin')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  registration_no VARCHAR(40),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dept_admin_has_department CHECK (role <> 'dept_admin' OR department_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS complaints (
  id                 SERIAL PRIMARY KEY,
  student_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id        INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  department_id      INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  title              VARCHAR(150) NOT NULL,
  description        TEXT NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'Pending'
                     CHECK (status IN ('Pending','In Progress','Resolved','Rejected')),
  priority           VARCHAR(10) NOT NULL DEFAULT 'Medium'
                     CHECK (priority IN ('Low','Medium','High','Urgent')),
  admin_response     TEXT,
  resolution_remarks TEXT,
  image_data         BYTEA,
  image_mime         VARCHAR(40),
  rating             SMALLINT CHECK (rating BETWEEN 1 AND 5),
  rating_comment     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at          TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_complaints_student    ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_category   ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created    ON complaints(created_at DESC);

CREATE TABLE IF NOT EXISTS complaint_history (
  id           SERIAL PRIMARY KEY,
  complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  actor_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(40) NOT NULL,
  from_status  VARCHAR(20),
  to_status    VARCHAR(20),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_history_complaint ON complaint_history(complaint_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
  type         VARCHAR(30) NOT NULL,
  title        VARCHAR(160) NOT NULL,
  message      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- Anonymous suggestions: deliberately no user reference so identity is never stored.
CREATE TABLE IF NOT EXISTS feedback (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
