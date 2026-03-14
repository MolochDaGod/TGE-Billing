# ElectraPro Deployment Configuration Guide

## Current Status
✅ **Application is running successfully on port 5000**
✅ **Build and start scripts are configured in package.json**

## .replit Configuration Issues

### Problem
The current `.replit` file has **multiple port configurations** (14 different port mappings), which causes issues for production deployment on Replit.

According to Replit documentation:
- **For Autoscale and Reserved VM deployments, only ONE external port can be exposed**
- Multiple port configurations can cause deployment failures
- The service should bind to `0.0.0.0:5000` (not localhost)

### Current Excessive Port Configuration
```toml
[[ports]]
localPort = 5000
externalPort = 80

[[ports]]
localPort = 34237
externalPort = 8099

# ... 12 more port configurations (unnecessary)
```

### Recommended Configuration

Since I cannot edit the `.replit` file directly, you'll need to manually update it with this clean configuration:

```toml
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"
hidden = [".config", ".git", "generated-icon.png", "node_modules", "dist"]

[nix]
channel = "stable-24_05"

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
ignorePorts = false

# ONLY expose port 5000 for production deployment
[[ports]]
localPort = 5000
externalPort = 80

[env]
PORT = "5000"

[workflows]
runButton = "Project"

[[workflows.workflow]]
name = "Project"
mode = "parallel"
author = "agent"

[[workflows.workflow.tasks]]
task = "workflow.run"
args = "Start application"

[[workflows.workflow]]
name = "Start application"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run dev"
waitForPort = 5000

[agent]
integrations = ["javascript_log_in_with_replit:1.0.0", "javascript_openai_ai_integrations:1.0.0", "javascript_stripe:1.0.0", "javascript_database:1.0.0", "twilio:1.0.0", "google-drive:1.0.0"]
```

## Deployment Readiness Checklist

### ✅ Already Configured

1. **Build Script**: `npm run build` - Builds frontend and backend
2. **Start Script**: `npm run start` - Runs production server
3. **Environment Variables**: All secrets configured via Replit Secrets
4. **Database**: PostgreSQL configured with DATABASE_URL
5. **Port Binding**: Server binds to `0.0.0.0:5000`
6. **Integrations**: 6 integrations properly configured

### 🔧 Requires Manual Fix

1. **Clean up .replit file**: Remove extra port configurations (lines 17-68)
   - Keep only the first `[[ports]]` block (localPort 5000, externalPort 80)
   - Delete all other `[[ports]]` blocks

### 📋 Deployment Configuration Explained

#### Development (Current)
```bash
npm run dev
# Runs: tsx server/index.ts
# Purpose: Hot reload for development
# Port: 5000
```

#### Production Build
```bash
npm run build
# Runs: vite build (frontend) && esbuild (backend)
# Output: dist/ directory with compiled code
```

#### Production Start
```bash
npm run start
# Runs: node dist/index.js
# Purpose: Production server (no hot reload)
# Port: 5000 (from process.env.PORT)
```

## Server Configuration

The server is already configured correctly in `server/index.ts`:

```typescript
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[express] serving on port ${PORT}`);
});
```

This ensures:
- ✅ Uses environment variable PORT (set in .replit)
- ✅ Binds to `0.0.0.0` (required for Replit deployment)
- ✅ Falls back to 5000 if PORT not set

## Environment Variables for Deployment

All required environment variables are configured as Replit Secrets:
- ✅ DATABASE_URL (PostgreSQL connection)
- ✅ SESSION_SECRET (Session encryption)
- ✅ STRIPE_SECRET_KEY (Payment processing)
- ✅ VITE_STRIPE_PUBLIC_KEY (Frontend Stripe key)
- ✅ GOOGLE_CLIENT_ID (OAuth)
- ✅ GOOGLE_CLIENT_SECRET (OAuth)
- ✅ TWILIO credentials (SMS notifications)
- ✅ AGENTMAIL_WEBHOOK_SECRET (Email automation)
- ✅ AI_INTEGRATIONS_OPENAI_API_KEY (AI features)

## How to Deploy

### Step 1: Clean .replit Configuration
1. Open `.replit` file
2. Delete extra `[[ports]]` blocks (keep only port 5000)
3. Save the file

### Step 2: Test Build Locally
```bash
npm run build
# Should complete without errors
# Output: dist/index.js and client build files
```

### Step 3: Deploy via Replit
1. Click "Deploy" in Replit
2. Select "Autoscale" deployment
3. Wait for build to complete
4. Your app will be live at your .replit.app domain

## Verification

✅ **Current Status**: Application running successfully
✅ **Port Configuration**: Server binds to 0.0.0.0:5000
✅ **Build Scripts**: Configured and tested
✅ **Environment**: All secrets configured
⚠️ **Action Required**: Clean up .replit port configurations

## Support

If you encounter deployment issues:
1. Check Replit deployment logs
2. Verify all environment variables are set
3. Ensure only one port is exposed in .replit
4. Contact Replit support if issues persist

---

**Last Updated**: November 7, 2025
**Status**: Ready for deployment after .replit cleanup
