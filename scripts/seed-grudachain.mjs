import { neon } from "@neondatabase/serverless";
import { randomBytes } from "crypto";

const sql = neon(process.env.DATABASE_URL?.trim());

// Ensure sessions table exists
await sql`
  CREATE TABLE IF NOT EXISTS "sessions" (
    "sid" varchar NOT NULL PRIMARY KEY,
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL
  )
`;
await sql`CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire")`;
console.log("✅ sessions table ready");

// Check if GRUDACHAIN already exists
const existing = await sql`
  SELECT id, email, name, role, puter_username
  FROM users
  WHERE puter_username = 'GRUDACHAIN'
  LIMIT 1
`;

if (existing.length > 0) {
  const u = existing[0];
  // Update to pirate_king if not already
  if (u.role !== "pirate_king") {
    await sql`UPDATE users SET role = 'pirate_king' WHERE id = ${u.id}`;
    console.log(`✅ GRUDACHAIN (${u.id}) upgraded to pirate_king`);
  } else {
    console.log(`✅ GRUDACHAIN already pirate_king (${u.id})`);
  }
} else {
  // Generate a unique referral code
  const referralCode = `TGE-${randomBytes(4).toString("hex").toUpperCase()}`;

  const created = await sql`
    INSERT INTO users (
      auth_provider,
      puter_username,
      email,
      name,
      role,
      referral_code
    ) VALUES (
      'puter',
      'GRUDACHAIN',
      'grudachain@puter.user',
      'GRUDACHAIN',
      'pirate_king',
      ${referralCode}
    )
    RETURNING id, name, role
  `;
  console.log(`✅ GRUDACHAIN created as pirate_king — id: ${created[0].id}`);
}

// Show all users
const allUsers = await sql`SELECT id, name, email, role, puter_username, auth_provider FROM users ORDER BY created_at`;
console.log(`\n📋 All users (${allUsers.length} total):`);
for (const u of allUsers) {
  console.log(`  [${u.role}] ${u.name} | puter: ${u.puter_username ?? "—"} | ${u.email}`);
}
