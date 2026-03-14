/**
 * Vercel Serverless Function — wraps the Express app.
 * Imports ONLY from server/app.ts to avoid pulling in Vite at module-parse time.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import { app, initApp } from "../server/app";

// Catch process-level crashes
process.on("uncaughtException", (err) => {
  console.error("[Lambda] uncaughtException:", err?.message, err?.stack);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Lambda] unhandledRejection:", reason);
});

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
        stack: initError.stack,
      });
    }
    app(req, res);
  } catch (err: any) {
    console.error("[Lambda] handler crash:", err?.message, err?.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: "Lambda handler crashed", error: err?.message, stack: err?.stack });
    }
  }
}
