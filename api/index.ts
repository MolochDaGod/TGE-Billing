/**
 * Vercel Serverless Function — wraps the Express app.
 * Imports ONLY from server/app.ts to avoid pulling in Vite at module-parse time.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import { app, initApp } from "../server/app";

// Kick off route registration once (warm start caches the promise).
// We store any init error so we can surface it in the response.
let initError: Error | null = null;
const ready = initApp().catch((err) => {
  initError = err;
  console.error("[api] initApp() failed:", err);
});

export default async function handler(req: any, res: any) {
  await ready;
  if (initError) {
    return res.status(500).json({
      message: "Server initialization failed",
      error: initError.message,
      stack: process.env.NODE_ENV !== "production" ? initError.stack : undefined,
    });
  }
  app(req, res);
}
