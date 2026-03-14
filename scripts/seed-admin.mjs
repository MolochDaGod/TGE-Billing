import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// 1. Create sessions table (connect-pg-simple format)
await sql`
  CREATE TABLE IF NOT EXISTS "sessions" (
    "sid" varchar NOT NULL PRIMARY KEY,
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL
  )
`;
await sql`CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire")`;
console.log("sessions table ready");

// 2. Check for GRUDACHAIN user
const users = await sql`SELECT id, email, name, role, puter_username FROM users WHERE puter_username ILIKE 'GRUDACHAIN' OR email ILIKE '%grudachain%' OR name ILIKE '%grudachain%'`;
console.log("Found users:", JSON.stringify(users));

// 3. Set any matching user to pirate_king
if (users.length > 0) {
  for (const u of users) {
    await sql`UPDATE users SET role = 'pirate_king' WHERE id = ${u.id}`;
    console.log("Set pirate_king:", u.id, u.name, u.email);
  }
}
