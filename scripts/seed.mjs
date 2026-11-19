// Seeds departments, categories, predefined admin accounts and demo data.
// Idempotent: safe to run multiple times. Never drops anything.
import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
const password = process.env.SEED_PASSWORD;
if (!url || !password) {
  console.error("DATABASE_URL and SEED_PASSWORD must be set");
  process.exit(1);
}
const db = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false } });
await db.connect();

const departments = [
  ["CAFETERIA", "Cafeteria Administration"],
  ["LIBRARY", "Library Administration"],
  ["LAB_IT", "Laboratory / IT Administration"],
  ["ACADEMIC", "Teaching / Academic Coordination"],
];
const categories = [
  ["CAFETERIA", "Cafeteria", "Food quality, hygiene, prices, variety, staff service", "CAFETERIA"],
  ["LIBRARY", "Library", "Books & resources, librarian availability, hours, seating", "LIBRARY"],
  ["LAB_IT", "Laboratories & IT Facilities", "Computers, internet, projectors, software", "LAB_IT"],
  ["ACADEMIC", "Teaching & Academic Affairs", "Late lectures, notes, explanations, classroom discipline", "ACADEMIC"],
];

for (const [code, name] of departments) {
  await db.query(`INSERT INTO departments(code,name) VALUES ($1,$2) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name`, [code, name]);
}
for (const [code, name, desc, dept] of categories) {
  await db.query(
    `INSERT INTO categories(code,name,description,department_id)
     VALUES ($1,$2,$3,(SELECT id FROM departments WHERE code=$4))
     ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, department_id=EXCLUDED.department_id`,
    [code, name, desc, dept]
  );
}

const hash = await bcrypt.hash(password, 10);
const users = [
  ["Super Administrator", "superadmin@campusconnect.edu", "super_admin", null, null],
  ["Cafeteria Admin", "cafeteria@campusconnect.edu", "dept_admin", "CAFETERIA", null],
  ["Library Admin", "library@campusconnect.edu", "dept_admin", "LIBRARY", null],
  ["Lab / IT Admin", "labit@campusconnect.edu", "dept_admin", "LAB_IT", null],
  ["Academic Coordinator", "academic@campusconnect.edu", "dept_admin", "ACADEMIC", null],
  ["Ayesha Khan", "ayesha@student.edu", "student", null, "BIIT-21-001"],
  ["Hamza Ali", "hamza@student.edu", "student", null, "BIIT-21-002"],
];
for (const [name, email, role, dept, reg] of users) {
  await db.query(
    `INSERT INTO users(name,email,password_hash,role,department_id,registration_no)
     VALUES ($1,$2,$3,$4,(SELECT id FROM departments WHERE code=$5),$6)
     ON CONFLICT (email) DO NOTHING`,
    [name, email, hash, role, dept, reg]
  );
}

// Demo complaints only if the table is empty, so real data is never touched.
const { rows: [{ count }] } = await db.query("SELECT count(*)::int AS count FROM complaints");
if (count === 0) {
  const uid = async (email) => (await db.query("SELECT id FROM users WHERE email=$1", [email])).rows[0].id;
  const ayesha = await uid("ayesha@student.edu");
  const hamza = await uid("hamza@student.edu");
  const admins = {
    CAFETERIA: await uid("cafeteria@campusconnect.edu"),
    LIBRARY: await uid("library@campusconnect.edu"),
    LAB_IT: await uid("labit@campusconnect.edu"),
    ACADEMIC: await uid("academic@campusconnect.edu"),
  };
  // [student, category, title, description, status, priority, daysAgo, response]
  const demo = [
    [ayesha, "CAFETERIA", "Unhygienic serving counter", "The serving counter in the main cafeteria is not cleaned between lunch rushes and flies are everywhere.", "Resolved", "High", 26, "Cleaning schedule increased to every 30 minutes during lunch."],
    [hamza, "CAFETERIA", "Food prices increased again", "Prices of sandwiches and tea increased by 20% without any notice to students.", "Rejected", "Low", 22, "Prices are set by the vendor contract approved for this semester."],
    [hamza, "CAFETERIA", "Dirty tables and flies in cafeteria", "Tables in the cafeteria are dirty and there are a lot of flies near the food counter.", "In Progress", "High", 6, "Pest control has been scheduled for this weekend."],
    [ayesha, "LIBRARY", "Not enough seating during exams", "During exam week there are no free seats in the library study hall after 10 AM.", "In Progress", "Medium", 18, "We are arranging extra tables in the reading room."],
    [hamza, "LIBRARY", "Outdated software engineering books", "Most software engineering books in the library are older than 10 years.", "Pending", "Medium", 9, null],
    [ayesha, "LAB_IT", "Lab 3 computers not booting", "Five computers in Lab 3 do not boot and show a disk error.", "Resolved", "Urgent", 20, "Hard drives replaced on all five systems."],
    [hamza, "LAB_IT", "Wi-Fi keeps disconnecting", "Campus Wi-Fi in Block B disconnects every few minutes, making online quizzes impossible.", "In Progress", "High", 12, "Access point replacement ordered for Block B."],
    [ayesha, "LAB_IT", "Internet connection drops in Block B", "The internet in Block B labs keeps dropping during practical sessions.", "Pending", "High", 3, null],
    [hamza, "LAB_IT", "Projector not working in Room 12", "Projector in Room 12 shows no signal with any laptop.", "Pending", "Medium", 2, null],
    [ayesha, "ACADEMIC", "Lecture notes not uploaded", "Data Structures lecture notes have not been uploaded for the last three weeks.", "Resolved", "Medium", 15, "Instructor has uploaded all pending notes to the LMS."],
    [hamza, "ACADEMIC", "Teacher arrives late regularly", "The 8:30 AM Calculus lecture starts 20 minutes late almost every day.", "Pending", "Medium", 4, null],
    [ayesha, "LIBRARY", "Library closes too early", "The library closes at 5 PM which is too early for evening students.", "Pending", "Low", 1, null],
  ];
  for (const [sid, cat, title, desc, status, priority, daysAgo, response] of demo) {
    const created = new Date(Date.now() - daysAgo * 864e5);
    const closed = status === "Resolved" || status === "Rejected" ? new Date(created.getTime() + (1 + (daysAgo % 4)) * 864e5) : null;
    const updated = closed ?? (status === "In Progress" ? new Date(created.getTime() + 864e5) : created);
    const { rows: [c] } = await db.query(
      `INSERT INTO complaints(student_id,category_id,department_id,title,description,status,priority,admin_response,resolution_remarks,created_at,updated_at,closed_at)
       SELECT $1, c.id, c.department_id, $3,$4,$5,$6,$7,$8,$9,$10,$11 FROM categories c WHERE c.code=$2 RETURNING id`,
      [sid, cat, title, desc, status, priority, response, closed ? response : null, created, updated, closed]
    );
    await db.query(`INSERT INTO complaint_history(complaint_id,actor_id,action,to_status,note,created_at) VALUES ($1,$2,'Submitted','Pending','Complaint submitted and routed automatically',$3)`, [c.id, sid, created]);
    if (status !== "Pending") {
      const t1 = new Date(created.getTime() + 864e5 / 2);
      await db.query(`INSERT INTO complaint_history(complaint_id,actor_id,action,from_status,to_status,note,created_at) VALUES ($1,$2,'Status Changed','Pending','In Progress',$3,$4)`, [c.id, admins[cat], status === "In Progress" ? response : "Complaint is under review", t1]);
    }
    if (closed) {
      await db.query(`INSERT INTO complaint_history(complaint_id,actor_id,action,from_status,to_status,note,created_at) VALUES ($1,$2,'Status Changed','In Progress',$3,$4,$5)`, [c.id, admins[cat], status, response, closed]);
    }
  }
  await db.query(`INSERT INTO feedback(category_id,message) SELECT id, 'Please add more vegetarian options to the menu.' FROM categories WHERE code='CAFETERIA'`);
  await db.query(`INSERT INTO feedback(category_id,message) SELECT id, 'A quiet zone with charging points would really help.' FROM categories WHERE code='LIBRARY'`);
  console.log("demo complaints seeded");
}
console.log("seed complete");
await db.end();
