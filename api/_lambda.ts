/**
 * Vercel Serverless Function — wraps the Express app.
 * Imports ONLY from server/app.ts to avoid pulling in Vite at module-parse time.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import { app, initApp } from "../server/app";

// Catch any process-level crashes and log them before dying
process.on("uncaughtException", (err) => {
  console.error("[Lambda] uncaughtException:", err?.message, err?.stack);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Lambda] unhandledRejection:", reason);
});

// Kick off route registration once (warm start caches the promise).
// We store any init error so we can surface it in the response.
let initError: Error | null = null;
const ready = initApp().catch((err) => {
  initError = err;
  console.error("[api] initApp() failed:", err?.message, err?.stack);
});

export default async function handler(req: any, res: any) {
  try {
    await ready;
    if (initError) {
      return res.status(500).json({
        message: "Server initialization failed",
        error: initError.message,
        stack: initError.stack,  // Always expose during debugging
      });
    }
    app(req, res);
  } catch (err: any) {
    console.error("[Lambda] handler crash:", err?.message, err?.stack);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Lambda handler crashed",
        error: err?.message,
        stack: err?.stack,
      });
    }
  }
}
