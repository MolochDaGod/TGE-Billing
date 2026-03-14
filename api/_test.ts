export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    hasDb: !!process.env.DATABASE_URL,
    hasSession: !!process.env.SESSION_SECRET,
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
  });
}
