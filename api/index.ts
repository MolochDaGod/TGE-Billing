/**
 * Vercel Serverless Function — wraps the Express app.
 * All /api/* and /attached_assets/* requests are routed here via vercel.json rewrites.
 */
import { app, initApp } from "../server/index";

// Ensure routes are registered before handling the first request
const ready = initApp();

export default async function handler(req: any, res: any) {
  await ready;
  app(req, res);
}
