# Production Database Setup for ElectraPro

## Overview
This guide will help you set up the production database with two admin accounts using Replit's PostgreSQL database.

## Admin Accounts to Create

1. **Admin Account 1**
   - Username: `admin`
   - Password: `admin123`
   - Email: admin@tgebilling.com

2. **Admin Account 2**
   - Username: `Chris`
   - Password: `admin123`
   - Email: chris@tgebilling.com

---

## Step 1: Publish Your App

Before setting up production database users, you need to publish your app so the database schema is created in production:

1. Click the **"Deploy"** or **"Publish"** button in Replit
2. Wait for the deployment to complete
3. This will create all database tables in your production database

---

## Step 2: Access Production Database

1. Open the **Database** pane in your Replit workspace (left sidebar)
2. Click on **"Production database"** tab
3. Click **"My data"** 
4. Toggle **"Edit"** mode to enable SQL queries

---

## Step 3: Run Production SQL Commands

Copy and paste these SQL commands into the production database query editor:

```sql
-- Create Admin Account 1: admin
INSERT INTO users (username, password_hash, auth_provider, email, name, role, referral_code, sms_notifications_enabled, email_notifications_enabled)
VALUES (
  'admin',
  '$2b$10$UvZEYLSghz6fT/VuxouJFO0Ql52.yjmK/VE38cYfP5hs6YDrAUxnu',
  'local',
  'admin@tgebilling.com',
  'Administrator',
  'admin',
  'TGE-ADMIN1',
  true,
  true
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    auth_provider = EXCLUDED.auth_provider,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
```

```sql
-- Create Admin Account 2: Chris
INSERT INTO users (username, password_hash, auth_provider, email, name, role, referral_code, sms_notifications_enabled, email_notifications_enabled)
VALUES (
  'Chris',
  '$2b$10$UvZEYLSghz6fT/VuxouJFO0Ql52.yjmK/VE38cYfP5hs6YDrAUxnu',
  'local',
  'chris@tgebilling.com',
  'Chris',
  'admin',
  'TGE-CHRIS1',
  true,
  true
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    auth_provider = EXCLUDED.auth_provider,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
```

---

## Step 4: Verify Admin Accounts

Run this query to verify both accounts were created:

```sql
SELECT username, email, name, role, auth_provider 
FROM users 
WHERE username IN ('admin', 'Chris')
ORDER BY username;
```

You should see:
| username | email | name | role | auth_provider |
|----------|-------|------|------|---------------|
| Chris | chris@tgebilling.com | Chris | admin | local |
| admin | admin@tgebilling.com | Administrator | admin | local |

---

## Step 5: Test Login

1. Navigate to your production app URL (ends with `.replit.app`)
2. Click **"Log In"**
3. Try logging in with:
   - Username: `admin` / Password: `admin123`
   - Username: `Chris` / Password: `admin123`

Both accounts should have full admin access to:
- Dashboard with business metrics
- Invoice management
- Client management
- Job scheduling
- Compliance tracking
- Sales pipeline
- Marketing tools
- User management
- System settings
- Sparky AI with admin-level business coaching

---

## Development Database (Already Done ✅)

The development database already has both admin accounts set up and ready to use:
- Username: `admin` / Password: `admin123`
- Username: `Chris` / Password: `admin123`

---

## Database Schema Status

All required tables are already configured in your schema:

✅ **Core Tables:**
- users (with auth support)
- company_settings
- clients
- invoices & invoice_items
- payments (Stripe integration)
- jobs

✅ **Compliance & Operations:**
- permits
- inspections
- work_orders
- compliance_checklists

✅ **Business Growth:**
- bookings
- sales_leads
- sales_activities
- marketing_content

✅ **AI & Automation:**
- ai_agents
- agent_conversations

✅ **System:**
- sessions (for login persistence)

---

## Security Notes

⚠️ **Important**: After setting up production, consider:

1. **Change default passwords** - The `admin123` password should be changed to something more secure
2. **Enable 2FA** (if implementing in the future)
3. **Monitor admin activity** through system logs
4. **Backup production database** regularly through Replit's backup features

---

## Troubleshooting

**Issue: Can't find production database**
- Solution: Make sure you've published your app at least once

**Issue: SQL query fails**
- Solution: Make sure "Edit" mode is enabled in the database pane
- Check that all tables exist by running: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

**Issue: Can't log in after creating accounts**
- Solution: Clear browser cache and try again
- Verify the accounts exist: `SELECT * FROM users WHERE username IN ('admin', 'Chris');`

**Issue: Role permissions not working**
- Solution: Verify role is set to 'admin': `UPDATE users SET role = 'admin' WHERE username IN ('admin', 'Chris');`

---

## Next Steps

After setting up production database:

1. ✅ Test both admin logins
2. ✅ Set up company settings (company name, license number, contact info)
3. ✅ Create your first client
4. ✅ Test invoice creation and Stripe payments
5. ✅ Test Sparky AI assistant for document creation
6. ✅ Configure SMS notifications (verify Twilio integration)
7. ✅ Set up email notifications (verify AgentMail integration)

---

## Support

If you encounter any issues:
1. Check the Replit console logs
2. Verify environment variables are set (DATABASE_URL, STRIPE_SECRET_KEY, etc.)
3. Contact Replit support for production database issues
