/**
 * server/db.ts
 * Connects to PostgreSQL using node-postgres (pg) pool.
 * Works with any standard PostgreSQL: local Docker, VPS, or managed.
 */
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
