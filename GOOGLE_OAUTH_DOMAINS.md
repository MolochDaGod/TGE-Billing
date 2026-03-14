# Google OAuth Domain Configuration - T.G.E. Billing

## ✅ Your Three Replit Domains

ElectraPro will be accessible on these three domains:

1. **`tgebilling.pro`** - Production custom domain
2. **`t-g-e.replit.app`** - Replit app domain  
3. **`t-g-e.replit.dev`** - Replit development domain

---

## 🔧 Google Cloud Console Setup

### **Step 1: Add All Three Authorized Redirect URIs**

Go to: **https://console.cloud.google.com/apis/credentials**

1. Click on your OAuth 2.0 Client ID: `1009244502007-pp2o25d1mecq8tjt7n7h6l9ur6k3pgqh.apps.googleusercontent.com`

2. Under **"Authorized redirect URIs"**, add ALL three:

```
https://tgebilling.pro/api/auth/google/callback
https://t-g-e.replit.app/api/auth/google/callback
https://t-g-e.replit.dev/api/auth/google/callback
```

3. Click **"Save"**

---

### **Step 2: Add All Three Authorized JavaScript Origins**

In the same OAuth client configuration:

Under **"Authorized JavaScript origins"**, add ALL three:

```
https://tgebilling.pro
https://t-g-e.replit.app
https://t-g-e.replit.dev
```

This allows the Google Sign-In button to work from any of your domains.

---

## 🎯 How It Works Across Domains

### **ElectraPro OAuth Configuration:**

The app automatically uses the correct callback URL based on the current domain:

```typescript
// server/auth.ts
callbackURL: "/api/auth/google/callback"
```

**This relative URL works on ALL three domains:**
- `https://tgebilling.pro/api/auth/google/callback` ✅
- `https://t-g-e.replit.app/api/auth/google/callback` ✅
- `https://t-g-e.replit.dev/api/auth/google/callback` ✅

**No code changes needed!** The same configuration works everywhere.

---

## 📋 Domain Usage Guide

### **1. `tgebilling.pro` - Production Domain**

**Purpose:** Live production app for real customers

**When to use:**
- Customer-facing production environment
- Real invoices, payments, client data
- Official business website
- Marketing and SEO

**Features:**
- ✅ Custom domain (professional)
- ✅ Google OAuth (production credentials)
- ✅ Stripe payments (live mode)
- ✅ Twilio SMS (production numbers)
- ✅ SSL certificate (HTTPS)

**Users:**
- Real customers
- Admin team
- Employees

---

### **2. `t-g-e.replit.app` - Replit App Domain**

**Purpose:** Production deployment on Replit hosting

**When to use:**
- Replit-hosted production environment
- Same as tgebilling.pro but on Replit's domain
- Can redirect to tgebilling.pro if desired

**Features:**
- ✅ Same as tgebilling.pro
- ✅ Automatic HTTPS
- ✅ Replit's CDN
- ✅ Easy deployment

**Note:** You can configure `tgebilling.pro` to point to this deployment

---

### **3. `t-g-e.replit.dev` - Development Domain**

**Purpose:** Testing and development

**When to use:**
- Testing new features before production
- Developer preview
- QA testing
- Training environment

**Features:**
- ✅ Google OAuth (same credentials work)
- ✅ Stripe test mode
- ✅ Separate development database (optional)
- ✅ Safe for experimentation

**Users:**
- Developers
- QA testers
- Internal testing only

---

## 🔐 Security Notes

### **All Three Domains Are Secure:**
- ✅ HTTPS enforced (Replit provides SSL automatically)
- ✅ Secure cookies (httpOnly, sameSite)
- ✅ Same security standards across all domains

### **Session Management:**
- Sessions are stored in PostgreSQL
- Cookies are domain-specific:
  - `tgebilling.pro` cookies don't work on `t-g-e.replit.app`
  - Users must log in separately on each domain

### **OAuth Tokens:**
- Google access tokens work across all domains
- User can sign in on any domain with same Google account
- User records are shared (same database)

---

## 🚀 Deployment Workflow

### **Recommended Setup:**

**Development Flow:**
```
1. Code changes → Push to Replit
2. Test on t-g-e.replit.dev
3. QA approval
4. Deploy to t-g-e.replit.app
5. Point tgebilling.pro DNS to Replit deployment
```

**Production Access:**
```
Customers use: tgebilling.pro
Internal team uses: t-g-e.replit.app or tgebilling.pro
Developers use: t-g-e.replit.dev (testing)
```

---

## 📊 Google Cloud Console Checklist

**Before deploying, verify Google Cloud settings:**

- [ ] All three redirect URIs added:
  - `https://tgebilling.pro/api/auth/google/callback`
  - `https://t-g-e.replit.app/api/auth/google/callback`
  - `https://t-g-e.replit.dev/api/auth/google/callback`

- [ ] All three JavaScript origins added:
  - `https://tgebilling.pro`
  - `https://t-g-e.replit.app`
  - `https://t-g-e.replit.dev`

- [ ] OAuth consent screen configured:
  - App name: "T.G.E. Billing - ElectraPro"
  - Support email: tgebilling@gmail.com
  - Scopes: email, profile
  - Logo uploaded (optional)

- [ ] OAuth client type: "Web application"

- [ ] Client ID saved in Replit Secrets: `GOOGLE_CLIENT_ID`

- [ ] Client Secret saved in Replit Secrets: `GOOGLE_CLIENT_SECRET`

---

## 🧪 Testing OAuth on All Domains

### **Test Procedure:**

**1. Test on Development (`t-g-e.replit.dev`):**
```
1. Open: https://t-g-e.replit.dev
2. Click "Continue with Google"
3. Sign in with Google account
4. Verify redirect to dashboard
5. Check user created in database
```

**2. Test on Replit App (`t-g-e.replit.app`):**
```
1. Open: https://t-g-e.replit.app
2. Click "Continue with Google"
3. Sign in (may need to log in again - different domain)
4. Verify redirect works
5. Same user from database (same Google ID)
```

**3. Test on Production (`tgebilling.pro`):**
```
1. Open: https://tgebilling.pro
2. Click "Continue with Google"
3. Sign in
4. Verify everything works
5. This is the customer-facing domain
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Redirect URI Mismatch" Error**

**Cause:** Domain not added to Google Cloud Console

**Solution:**
1. Go to Google Cloud Console
2. Add missing redirect URI
3. Wait 5 minutes for changes to propagate
4. Try again

---

### **Issue 2: "Access Blocked" Error**

**Cause:** OAuth consent screen not configured or app in testing mode

**Solution:**
1. Go to OAuth consent screen settings
2. If in "Testing" mode, add your email to test users
3. Or publish the app (requires verification for production)

---

### **Issue 3: OAuth Works on One Domain But Not Another**

**Cause:** Forgot to add all three domains

**Solution:**
1. Check Google Cloud Console
2. Verify ALL three redirect URIs are listed
3. Verify ALL three JavaScript origins are listed
4. Save and wait 5 minutes

---

### **Issue 4: User Can't Access App After Signing In**

**Cause:** Session cookie domain mismatch

**Solution:**
- This is normal - cookies are domain-specific
- User must log in separately on each domain
- Consider using only one domain for customers (tgebilling.pro)

---

## 🎯 Recommended Configuration

### **For Production:**

**Use `tgebilling.pro` as primary domain:**
- Point DNS to Replit deployment
- All customers use this domain
- Professional appearance
- SEO benefits

**Keep `t-g-e.replit.app` as backup:**
- Automatic Replit hosting
- Fallback if custom domain has issues
- Can redirect to tgebilling.pro

**Keep `t-g-e.replit.dev` for development:**
- Internal testing only
- Safe environment for new features
- Separate from production

---

## 📞 Support Resources

### **Google OAuth Documentation:**
- Setup Guide: https://developers.google.com/identity/protocols/oauth2
- Redirect URI Guide: https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation

### **Replit Documentation:**
- Custom Domains: https://docs.replit.com/hosting/deployments/custom-domains
- Deployment Guide: https://docs.replit.com/hosting/deployments/about-deployments

---

## ✅ Summary

**Your Three Domains:**
1. **tgebilling.pro** - Production (customers)
2. **t-g-e.replit.app** - Replit hosting (production)
3. **t-g-e.replit.dev** - Development (testing)

**Google OAuth Setup:**
- Add all three redirect URIs to Google Cloud Console
- Add all three JavaScript origins
- Same credentials work on all domains
- ElectraPro code automatically handles domain detection

**No code changes needed** - just configure Google Cloud Console and you're ready to go! 🚀
