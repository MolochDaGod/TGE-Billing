/**
 * BISECT TEST — minimal Lambda, no imports.
 * If this returns 200, the Lambda infrastructure works.
 */
export default function handler(req: any, res: any) {
  res.status(200).json({ ok: true, url: req.url, method: req.method });
}
