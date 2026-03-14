/**
 * server/app.ts
 * Pure Express application setup — NO Vite, NO listen(), NO static serving.
 * Imported by both server/index.ts (local dev) and api/index.ts (Vercel serverless).
 */
import express, { type Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
// NOTE: registerRoutes is imported dynamically inside initApp() so that
// heavy dependencies (db, stripe, bcrypt, twilio …) are only loaded on
// first invocation, not at module-parse time.  This prevents cold-start
// module-level throws from crashing the serverless function before we can
// return a useful error response.

// ESM-safe __dirname (works Node 18+)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
export const isProduction = process.env.NODE_ENV === "production";

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.puter.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:", "https:", "https://api.puter.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
}));

// CORS — allow Vercel preview/production URLs + custom domain
const allowedOrigins = [
  process.env.APP_URL || "https://tgebilling.pro",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "",
  "https://tge-billing.vercel.app",
  "https://tge-billing-grudgenexus.vercel.app",
].filter(Boolean);

app.use(cors({
  origin: isProduction ? allowedOrigins : true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith("/api/"),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/auth/google", authLimiter);

// Serve attached_assets if the directory exists (local dev only)
const attachedAssetsPath = path.resolve(__dirname, "..", "attached_assets");
app.use("/attached_assets", express.static(attachedAssetsPath));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const p = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (p.startsWith("/api")) {
      let logLine = `${req.method} ${p} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      console.log(`[express] ${logLine}`);
    }
  });

  next();
});

// Routes + error handler registered lazily via dynamic import
let _routesReady: Promise<void> | null = null;

export function initApp(): Promise<void> {
  if (!_routesReady) {
    _routesReady = (async () => {
      // Dynamic import ensures all heavy deps (db, stripe, twilio …) are
      // loaded asynchronously and any failure is catchable.
      const { registerRoutes } = await import("./routes");
      await registerRoutes(app);

      // Error handler MUST come after routes
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = isProduction
          ? "Internal Server Error"
          : err.message || "Internal Server Error";

        console.error(`[Error] ${err.message || "Unknown error"}`, {
          status,
          stack: err.stack,
          path: _req.path,
          method: _req.method,
        });

        res.status(status).json({ message });
      });
    })();
  }
  return _routesReady;
}
