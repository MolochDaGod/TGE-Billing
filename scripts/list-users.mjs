import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const users = await sql`SELECT id, name, email, role, puter_username, auth_provider, created_at FROM users ORDER BY created_at LIMIT 20`;
console.log("All users:", JSON.stringify(users, null, 2));
