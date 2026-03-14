/**
 * BISECT STEP 2 — import server/app but no initApp.
 */
import { app } from "../server/app";

export default function handler(req: any, res: any) {
  res.status(200).json({ ok: true, appLoaded: !!app });
}
