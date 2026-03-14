/**
 * Vercel Serverless Function — wraps the Express app.
 * Imports ONLY from server/app.ts to avoid pulling in Vite at module-parse time.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import { app, initApp } from "../server/app";

// Kick off route registration once (warm start caches the promise)
const ready = initApp();

export default async function handler(req: any, res: any) {
  await ready;
  app(req, res);
}
