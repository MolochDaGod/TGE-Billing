import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupRealtimeAI } from "./realtimeAI";
import { seedAIAgents } from "./services/ai-agents-seed";
import { seedDefaultAutomations } from "./services/ai-automation";
import { seedWorkflowTemplates } from "./services/ai-workflow-templates";

export const app = express();
const isProduction = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL;

// Security headers with helmet (relaxed CSP for development)
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:", "https:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
}));

// CORS configuration — allow Vercel preview/production URLs
const allowedOrigins = [
  process.env.APP_URL || 'https://tgebilling.pro',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '',
].filter(Boolean);

app.use(cors({
  origin: isProduction ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api/'), // Only limit API routes
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login attempts per windowMs
  message: { message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/auth/google', authLimiter);

// Serve attached_assets folder for vendor logos and images
app.use('/attached_assets', express.static(path.resolve(import.meta.dirname, '..', 'attached_assets')));

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize routes (exported for Vercel serverless usage)
let _initPromise: Promise<void> | null = null;
export function initApp() {
  if (!_initPromise) {
    _initPromise = (async () => {
      const server = await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = isProduction ? "Internal Server Error" : (err.message || "Internal Server Error");

        console.error(`[Error] ${err.message || 'Unknown error'}`, {
          status,
          stack: err.stack,
          path: _req.path,
          method: _req.method,
        });

        res.status(status).json({ message });
      });

      // On Vercel, skip Vite dev server, static serving, and listen()
      if (!isVercel) {
        // Setup Realtime AI voice conversation WebSocket (not supported on Vercel)
        setupRealtimeAI(server);

        if (app.get("env") === "development") {
          await setupVite(app, server);
        } else {
          serveStatic(app);
        }

        const port = parseInt(process.env.PORT || '5000', 10);
        server.listen({
          port,
          host: "0.0.0.0",
          reusePort: true,
        }, async () => {
          log(`serving on port ${port}`);

          try {
            await seedAIAgents();
            await seedDefaultAutomations();
            await seedWorkflowTemplates();
            log("[AI Systems] All AI agents, automations, and workflows seeded successfully");
          } catch (error) {
            console.error("[AI Systems] Error seeding AI systems:", error);
          }
        });
      }
    })();
  }
  return _initPromise;
}

// Auto-start when running directly (not imported by Vercel)
if (!isVercel) {
  initApp();
}
