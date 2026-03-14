import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import bcrypt from "bcrypt";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { nanoid } from "nanoid";

const SALT_ROUNDS = 10;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

// Generate unique referral code
function generateReferralCode(): string {
  return `TGE-${nanoid(8).toUpperCase()}`;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // ============================================
  // Local Strategy (Username/Password)
  // ============================================
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            return done(null, false, { message: "Invalid credentials" });
          }

          if (!user.password_hash) {
            return done(null, false, { message: "Invalid credentials" });
          }

          const isValid = await bcrypt.compare(password, user.password_hash);
          if (!isValid) {
            return done(null, false, { message: "Invalid credentials" });
          }

          return done(null, { userId: user.id });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // ============================================
  // Google OAuth Strategy
  // ============================================
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Determine the correct callback URL based on environment
    const getCallbackURL = () => {
      const appUrl = process.env.APP_URL || 'https://tgebilling.pro';
      return `${appUrl}/api/auth/google/callback`;
    };

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: getCallbackURL(),
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with this Google ID
            let user = await storage.getUserByGoogleId(profile.id);

            if (!user) {
              // Check if email exists (user switching from local to Google)
              const email = profile.emails?.[0]?.value;
              if (email) {
                const existingUser = await storage.getUserByEmail(email);
                if (existingUser) {
                  // Link Google account to existing user
                  await storage.updateUser(existingUser.id, {
                    google_id: profile.id,
                    avatar_url: profile.photos?.[0]?.value || existingUser.avatar_url,
                  });
                  return done(null, { userId: existingUser.id });
                }
              }

              // Create new user
              const allUsers = await storage.getAllUsers();
              const role = allUsers.length === 0 ? "admin" : "client";

              const newUser = await storage.createUser({
                auth_provider: "google",
                google_id: profile.id,
                email: profile.emails?.[0]?.value || `${profile.id}@google.placeholder`,
                name: profile.displayName || "Google User",
                role,
                avatar_url: profile.photos?.[0]?.value,
                referral_code: generateReferralCode(),
              });

              return done(null, { userId: newUser.id });
            }

            return done(null, { userId: user.id });
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // ============================================
  // Passport Session Management
  // ============================================
  passport.serializeUser((user: any, cb) => cb(null, user.userId));
  passport.deserializeUser(async (userId: string, cb) => {
    try {
      const user = await storage.getUserById(userId);
      cb(null, user);
    } catch (error) {
      cb(error, null);
    }
  });

  // ============================================
  // Registration Route
  // ============================================
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, name } = req.body;

      if (!username || !password || !email || !name) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Determine role (first user is admin)
      const allUsers = await storage.getAllUsers();
      const role = allUsers.length === 0 ? "admin" : "client";

      // Create user
      const user = await storage.createUser({
        auth_provider: "local",
        username,
        password_hash: passwordHash,
        email,
        name,
        role,
        referral_code: generateReferralCode(),
      });

      // Auto-login
      req.login({ userId: user.id }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.status(201).json({ message: "Registration successful", user: { id: user.id, email: user.email, name: user.name, role: user.role } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Local Login Route
  // ============================================
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        return storage.getUserById(user.userId).then((dbUser) => {
          if (!dbUser) {
            return res.status(404).json({ message: "User not found" });
          }
          res.json({ message: "Login successful", user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role } });
        });
      });
    })(req, res, next);
  });

  // ============================================
  // Google OAuth Routes
  // ============================================
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      console.log('[Google OAuth] Callback received');
      passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
          console.error('[Google OAuth] Authentication error:', err);
          return res.redirect("/auth?error=google_auth_error");
        }
        if (!user) {
          console.error('[Google OAuth] No user returned:', info);
          return res.redirect("/auth?error=google_auth_failed");
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('[Google OAuth] Login error:', loginErr);
            return res.redirect("/auth?error=login_failed");
          }
          console.log('[Google OAuth] Login successful, redirecting to /');
          res.redirect("/");
        });
      })(req, res, next);
    }
  );

  // ============================================
  // Puter Auth Route
  // ============================================
  app.post("/api/auth/puter", async (req, res) => {
    try {
      const { username, email, name } = req.body;

      if (!username) {
        return res.status(400).json({ message: "Puter username is required" });
      }

      // Check if user exists with this Puter username
      let user = await storage.getUserByPuterUsername(username);

      if (!user) {
        // Check if email matches an existing user
        if (email) {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser) {
            // Link Puter account to existing user
            await storage.updateUser(existingUser.id, { puter_username: username });
            user = existingUser;
          }
        }

        if (!user) {
          // Create new user with Puter auth
          const allUsers = await storage.getAllUsers();
          const role = allUsers.length === 0 ? "admin" : "client";

          user = await storage.createUser({
            auth_provider: "puter",
            puter_username: username,
            email: email || `${username}@puter.user`,
            name: name || username,
            role,
            referral_code: generateReferralCode(),
          });
        }
      }

      // Create server session
      req.login({ userId: user.id }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Session creation failed" });
        }
        res.json({
          message: "Puter auth successful",
          user: { id: user!.id, email: user!.email, name: user!.name, role: user!.role },
        });
      });
    } catch (error) {
      console.error("Puter auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================
  // Current User Route
  // ============================================
  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    res.json(user);
  });

  // ============================================
  // Logout Route
  // ============================================
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect("/");
    });
  });
}

// ============================================
// Middleware: isAuthenticated
// ============================================
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// ============================================
// Middleware: requireRole
// ============================================
export const requireRole = (...allowedRoles: string[]): RequestHandler => async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
  }

  next();
};
