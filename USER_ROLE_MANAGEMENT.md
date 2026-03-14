# User Role Management — TGE Operations

## How User Roles Work

### **Roles:**
1. **Owner (pirate_king)** — Full system access, top-level control
2. **Admin** — Full system access (manage users, settings, all features)
3. **Partner** — Co-manages business, access to users and settings
4. **Team Lead (staff_captain)** — Department management, operations access
5. **Staff** — Operations access (invoices, estimates, jobs, clients)
6. **Vendor** — Service provider view (own clients, invoices, estimates, jobs)
7. **Client** — Customer portal (view own invoices, make payments, book services)

---

## **Default Role Assignment:**

### **First User = Admin**
- The **very first person** to create an account automatically becomes an Admin
- This happens whether they register with:
  - Username/password
  - Google OAuth
  - Replit Auth

### **All Other Users = Client by Default**
- Anyone who registers after the first user defaults to **Client** role
- This applies to:
  - New username/password registrations
  - New Google OAuth sign-ins
  - New Replit Auth logins

---

## **How Admins Create Employees:**

### **Option 1: Change Existing Client to Employee (Current System)**

1. **Admin logs in** to ElectraPro
2. **Navigate to Users page** (Admin-only access)
3. **Find the user** you want to make an employee
4. **Click "Change Role"** button
5. **Select "Employee"** from dropdown
6. **Confirm** - User is now an employee!

**Limitations:**
- User must register first (as client)
- Admin must manually change their role
- Not ideal for onboarding new employees

---

### **Option 2: Create Employee Directly (Recommended - Need to Add)**

**This feature doesn't exist yet, but should be added for better workflow:**

1. Admin goes to Users page
2. Clicks **"Add New Employee"** button
3. Fills out employee information:
   - Full name
   - Email address
   - Username
   - Temporary password (they change on first login)
   - Phone number (for SMS notifications)
4. User is created with **Employee** role automatically
5. Employee receives email/SMS with login credentials

**Benefits:**
- No need for employee to register first
- Direct employee onboarding workflow
- Admin controls the process from start

---

## **Current User Management Features:**

### **What Admins Can Do Now:**
✅ View all users in the system
✅ Filter users by role (Admin, Employee, Client)
✅ Search users by name or email
✅ Change any user's role (Admin → Employee → Client)
✅ View user details (profile, email, role, login method)
✅ See statistics (total users, admins, employees, clients)

### **What Admins CANNOT Do Yet:**
❌ Create new employees directly (must wait for them to register, then change role)
❌ Send invitation emails to new employees
❌ Bulk import employees from CSV
❌ Deactivate/suspend user accounts

---

## **Recommended Workflow (Current System):**

### **Onboarding a New Employee:**

1. **Admin creates employee account:**
   - Option A: Have employee register at `/auth` (becomes client)
   - Option B: Admin registers on their behalf (temporarily)

2. **Admin upgrades role:**
   - Go to Users page (`/users`)
   - Find the new user
   - Click "Change Role"
   - Select "Employee"
   - Confirm

3. **Employee logs in:**
   - Employee sees employee dashboard
   - Has access to invoices, jobs, clients
   - Cannot manage users or settings

---

## **Role Permissions:**

### **Admin Can Access:**
- ✅ Dashboard (business KPIs, revenue, stats)
- ✅ Invoices (create, edit, view all)
- ✅ Clients (manage all clients)
- ✅ Jobs (schedule, assign, manage all)
- ✅ Sales (leads, activities, pipeline)
- ✅ Marketing (content generation, campaigns)
- ✅ Bookings (appointments, calendar)
- ✅ Referrals (tracking, rewards)
- ✅ Messages (team SMS communication)
- ✅ AI Agents (create custom assistants)
- ✅ Compliance (TDLR, NEC, permits, inspections)
- ✅ **Users (manage all users)** ⭐
- ✅ **Settings (company-wide settings)** ⭐
- ✅ About, Guides

### **Employee Can Access:**
- ✅ Dashboard (their schedule, assigned jobs)
- ✅ Invoices (create, view all)
- ✅ Clients (manage all clients)
- ✅ Jobs (view all, update assigned jobs)
- ✅ Bookings (appointments, calendar)
- ✅ Referrals (tracking, rewards)
- ✅ Messages (team SMS if admin enables)
- ✅ Compliance (permits, inspections for their jobs)
- ✅ About, Employee Guide
- ❌ **Users** (cannot manage users)
- ❌ **Settings** (cannot change company settings)
- ❌ **Sales** (sales features reserved for admin)
- ❌ **Marketing** (marketing features reserved for admin)
- ❌ **AI Agents** (cannot create custom AI agents)

### **Client Can Access:**
- ✅ Dashboard (their invoices, outstanding balance)
- ✅ Invoices (view their own only, make payments)
- ✅ Jobs (view their own jobs, track status)
- ✅ Bookings (schedule appointments for themselves)
- ✅ Referrals (share referral code, track rewards)
- ✅ Client Guide
- ❌ **Cannot see other clients' data**
- ❌ **Cannot create invoices or jobs**
- ❌ **All admin/employee features locked**

---

## **Future Enhancements to Add:**

### **Priority 1: Direct Employee Creation**
- Add "Create New Employee" button on Users page
- Form fields: name, email, username, temp password, phone
- Auto-send welcome email with credentials
- Employee changes password on first login

### **Priority 2: Invitation System**
- Admin sends email invitation to employee
- Employee clicks link, creates password, automatically assigned employee role
- Tracks pending invitations (sent, accepted, expired)

### **Priority 3: Bulk Import**
- Upload CSV of employees
- Auto-create accounts with employee role
- Send batch welcome emails

### **Priority 4: User Deactivation**
- Soft delete (don't remove data, just disable login)
- Reactivate deactivated users
- Show deactivated users separately

---

## **Security Notes:**

✅ **Password Security:**
- All passwords hashed with bcrypt (10 rounds)
- Never stored in plain text
- Never exposed in API responses

✅ **Role Protection:**
- Middleware checks role before allowing access
- Frontend hides unauthorized pages
- Backend enforces role requirements on all routes

✅ **Session Management:**
- Sessions stored in PostgreSQL (secure, persistent)
- Auto-logout after inactivity
- Secure cookies (HTTP-only, same-site)

---

## **Common Questions:**

### **Q: Can an employee upgrade themselves to admin?**
**A:** No. Only existing admins can change user roles.

### **Q: What if I accidentally make someone an admin?**
**A:** Admins can change any user's role, including downgrading other admins to employee or client.

### **Q: Can I have multiple admins?**
**A:** Yes! You can have as many admins as needed. Just change their role to admin.

### **Q: What if the first user (auto-admin) leaves the company?**
**A:** Create a new admin first, then have the new admin change the old admin's role to client or delete them.

### **Q: Do clients see employee features?**
**A:** No. The sidebar and navigation automatically hide features based on role.

### **Q: Can employees message clients via SMS?**
**A:** Currently, only admins can send SMS messages. Employees can view jobs and client info but cannot send direct SMS.

---

## **Technical Implementation:**

**Database Schema:**
```sql
-- users table includes role column
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  role VARCHAR(20) DEFAULT 'client', -- admin, employee, or client
  -- other fields...
);
```

**Middleware Protection:**
```typescript
// Only admins can access this route
app.get('/api/users', requireRole('admin'), async (req, res) => {
  // ...
});
```

**Frontend Navigation:**
```typescript
// Sidebar hides based on role
{user?.role === 'admin' && (
  <SidebarMenuItem href="/users">Users</SidebarMenuItem>
)}
```

---

## **Last Updated:**
November 4, 2025

## **Maintained By:**
T.G.E. Billing - ElectraPro Development Team
