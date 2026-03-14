# ElectraPro Application Library & Rules

**Last Updated**: November 7, 2025  
**Version**: 1.0.0  
**Status**: Production Ready

---

## 📚 Table of Contents

1. [Application Overview](#application-overview)
2. [Page Structure & Routes](#page-structure--routes)
3. [Role-Based Access Control](#role-based-access-control)
4. [Component Architecture](#component-architecture)
5. [Data Flow & State Management](#data-flow--state-management)
6. [API Routes & Backend](#api-routes--backend)
7. [Development Rules](#development-rules)
8. [Adding New Features](#adding-new-features)

---

## 🎯 Application Overview

ElectraPro is a **full-stack electrical services business management platform** for T.G.E. Billing (Texas Master Electrician License #750779).

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript (ESM)
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM
- **Auth**: Multi-provider (Local, Google OAuth, Replit Auth)
- **Payments**: Stripe API
- **AI**: OpenAI GPT-4 (Sparky Assistant)
- **Communications**: Twilio (SMS), AgentMail (Email)
- **Storage**: Google Cloud Storage, Google Drive

### Core Features
1. Invoice Management with PDF generation
2. Client Tracking & CRM
3. Job Scheduling & Management
4. Stripe Payment Processing
5. AI Assistant (Sparky) with voice activation
6. SMS & Email Notifications
7. Sales Pipeline & Lead Tracking
8. Compliance Management (TDLR, NEC 2023)
9. Team Messaging
10. Referral System

---

## 📄 Page Structure & Routes

### Public Pages (Unauthenticated)
| Page | Route | File | Purpose |
|------|-------|------|---------|
| **Landing** | `/` | `landing.tsx` | Marketing homepage for T.G.E. Billing |
| **Auth** | `/auth` | `auth.tsx` | Login/Register (Local, Google, Replit Auth) |
| **Not Found** | `*` | `not-found.tsx` | 404 error page |

### Authenticated Pages (Require Login)

#### Dashboard Pages (Role-Specific)
| Page | Route | File | Roles | Purpose |
|------|-------|------|-------|---------|
| **Admin Dashboard** | `/` | `admin-dashboard.tsx` | Admin | Full business overview with KPIs |
| **Employee Dashboard** | `/` | `employee-dashboard.tsx` | Employee | Daily schedule, assigned jobs |
| **Client Dashboard** | `/` | `client-dashboard.tsx` | Client | View invoices, payments, appointments |

**Note**: The root route `/` uses `RoleDashboard` component which renders the appropriate dashboard based on user role.

#### Core Business Operations
| Page | Route | File | Roles | Purpose |
|------|-------|------|-------|---------|
| **Invoices** | `/invoices` | `invoices.tsx` | Admin, Employee | Create, edit, send invoices |
| **Clients** | `/clients` | `clients.tsx` | Admin, Employee | CRM - manage client information |
| **Jobs** | `/jobs` | `jobs.tsx` | Admin, Employee | Schedule and track electrical work |
| **Payment** | `/payment/:invoiceId` | `payment.tsx` | All | Stripe payment page for invoices |

#### Business Growth & Marketing
| Page | Route | File | Roles | Purpose |
|------|-------|------|-------|---------|
| **Sales** | `/sales` | `sales.tsx` | Admin, Employee | Lead tracking, pipeline management |
| **Marketing** | `/marketing` | `marketing.tsx` | Admin | AI-generated marketing content |
| **Bookings** | `/bookings` | `bookings.tsx` | All | Schedule appointments online |
| **Referrals** | `/referrals` | `referrals.tsx` | All | Referral program management |

#### Communication & AI
| Page | Route | File | Roles | Purpose |
|------|-------|------|-------|---------|
| **Messages** | `/messages` | `messages.tsx` | Admin, Employee | Team SMS messaging via Twilio |
| **AI Agents** | `/ai-agents` | `ai-agents.tsx` | Admin | Manage AI agents for automation |

#### Compliance & Administration
| Page | Route | File | Roles | Purpose |
|------|-------|------|-------|---------|
| **Compliance** | `/compliance` | `compliance.tsx` | Admin, Employee | TDLR, NEC 2023 compliance tracking |
| **Users** | `/users` | `users.tsx` | Admin | User management (add/edit/delete) |
| **Settings** | `/settings` | `settings.tsx` | Admin | Company settings, branding |

#### Help & Documentation
| Page | Route | File | Roles | Purpose |
|------|-------|------|-------|---------|
| **About** | `/about` | `about.tsx` | All | Company information |
| **Admin Guide** | `/admin-guide` | `admin-guide.tsx` | Admin | Admin user manual |
| **Employee Guide** | `/employee-guide` | `employee-guide.tsx` | Employee | Employee user manual |
| **Client Guide** | `/client-guide` | `client-guide.tsx` | Client | Client portal help |

### Unused Pages (Exist but Not Routed)
| File | Status | Action Needed |
|------|--------|---------------|
| `home.tsx` | Not used | Delete or integrate if needed |

---

## 🔐 Role-Based Access Control

### User Roles
```typescript
type UserRole = 'admin' | 'employee' | 'client';
```

### Role Hierarchy & Permissions

#### Admin (Full Access)
- ✅ All invoice operations (create, edit, delete, send, view all)
- ✅ All client management
- ✅ All job management
- ✅ User management (create, edit, delete users)
- ✅ Company settings
- ✅ Financial reports and analytics
- ✅ Marketing content generation
- ✅ AI agent management
- ✅ Team messaging
- ✅ Compliance management
- ✅ Sales pipeline management

#### Employee (Operations Access)
- ✅ Create and edit invoices
- ✅ View all clients and client management
- ✅ Create and manage jobs
- ✅ View own schedule and assigned tasks
- ✅ Send messages to team
- ✅ Compliance tracking
- ✅ Sales lead tracking
- ❌ Cannot manage users
- ❌ Cannot change company settings
- ❌ Cannot access financial analytics

#### Client (View-Only Access)
- ✅ View own invoices
- ✅ Make payments via Stripe
- ✅ View own appointments
- ✅ Book new appointments
- ✅ View referral rewards
- ✅ Access client portal
- ❌ Cannot see other clients' data
- ❌ Cannot create invoices
- ❌ Cannot manage jobs
- ❌ No admin or employee features

### Implementation Pattern

#### In Backend Routes (`server/routes.ts`)
```typescript
// Middleware for role checking
function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

// Example usage
app.get('/api/users', requireRole('admin'), async (req, res) => {
  // Only admins can access this
});
```

#### In Frontend Components
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <div>Access Denied</div>;
  }
  
  // Admin-only content
}
```

#### In Sidebar Navigation (`client/src/components/app-sidebar.tsx`)
```typescript
// Navigation items filtered by role
const adminOnlyItems = user?.role === 'admin' ? [...] : [];
```

---

## 🏗️ Component Architecture

### Key Components

#### Core UI Components (`client/src/components/ui/`)
- Built on Shadcn/ui and Radix UI
- Dark mode by default
- Accessible, customizable
- **Never modify these directly** - use wrapper components instead

#### Custom Components (`client/src/components/`)

##### AIAssistant (`ai-assistant.tsx`)
- **Purpose**: Sparky AI assistant with voice activation
- **Features**: 
  - Voice commands ("Hey Sparky")
  - Chat interface
  - Context-aware responses
  - Function calling (create clients, invoices)
- **Safety**: Split into wrapper + internal components to prevent React hook errors
- **Available to**: Admin, Employee roles only

##### AppSidebar (`app-sidebar.tsx`)
- **Purpose**: Main navigation sidebar
- **Features**:
  - Role-based menu items
  - Collapsible sections
  - Active route highlighting
- **Updates required when**: Adding new pages or changing navigation structure

##### ErrorBoundary (`ErrorBoundary.tsx`)
- **Purpose**: Catch React errors gracefully
- **Features**:
  - User-friendly error page
  - Refresh and home navigation
  - Error logging
- **Rule**: Never remove this - it prevents white screens of death

### Layout Structure

```
App (ErrorBoundary wrapper)
└── QueryClientProvider (React Query)
    └── TooltipProvider
        └── AppContent
            ├── Router (unauthenticated) → Landing, Auth
            └── SidebarProvider (authenticated)
                ├── AppSidebar
                ├── Header (SidebarTrigger)
                ├── Main Content (Router)
                └── AIAssistant (floating)
```

---

## 🔄 Data Flow & State Management

### React Query (TanStack Query v5)

#### Queries (GET requests)
```typescript
import { useQuery } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/invoices'],
  // queryFn is auto-configured in queryClient
});

// With parameters
const { data } = useQuery({
  queryKey: ['/api/invoices', id],
});
```

#### Mutations (POST/PUT/DELETE)
```typescript
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

const mutation = useMutation({
  mutationFn: async (data: InvoiceInsert) => {
    const res = await apiRequest('POST', '/api/invoices', data);
    return res.json();
  },
  onSuccess: () => {
    // CRITICAL: Invalidate cache to refetch data
    queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
  },
});
```

### Error Handling

#### Automatic Retry Logic
- Network errors: 3 retries with exponential backoff (1s, 2s, 4s)
- Server errors (5xx): 3 retries
- Client errors (4xx): No retry
- Auth errors (401, 403): No retry, redirect to login

#### Network Error Recovery
```typescript
// Configured in client/src/lib/queryClient.ts
- Auto-retry on network failures
- User-friendly error messages
- Exponential backoff prevents server overload
```

### Authentication State

#### useAuth Hook
```typescript
const { user, isAuthenticated, isLoading } = useAuth();

// user: { id, email, role, name, ... } | null
// isAuthenticated: boolean
// isLoading: boolean (checking session)
```

**Rules**:
1. Always check `isLoading` before rendering auth-dependent UI
2. Use `isAuthenticated` to show/hide features
3. Check `user.role` for role-based features

---

## 🌐 API Routes & Backend

### Route Organization (`server/routes.ts`)

```
POST   /api/auth/login           - Local username/password login
POST   /api/auth/register         - Create new account
GET    /api/auth/user             - Get current user session
POST   /api/auth/logout           - End session
GET    /api/auth/google           - Google OAuth start
GET    /api/auth/google/callback  - Google OAuth callback
GET    /api/auth/oidc/callback    - Replit Auth callback

GET    /api/clients               - List all clients
POST   /api/clients               - Create client
PUT    /api/clients/:id           - Update client
DELETE /api/clients/:id           - Delete client

GET    /api/invoices              - List all invoices
GET    /api/invoices/:id          - Get single invoice
GET    /api/invoices/:id/pdf      - Download invoice as PDF
POST   /api/invoices              - Create invoice
PUT    /api/invoices/:id          - Update invoice
DELETE /api/invoices/:id          - Delete invoice

GET    /api/jobs                  - List all jobs
POST   /api/jobs                  - Create job
PUT    /api/jobs/:id              - Update job
DELETE /api/jobs/:id              - Delete job

POST   /api/payments/create-intent - Create Stripe payment intent
POST   /api/payments/webhook      - Stripe webhook handler

POST   /api/ai/assistant          - Sparky AI chat endpoint
POST   /api/ai/marketing          - Generate marketing content

GET    /api/dashboard/stats       - Dashboard KPIs (role-aware)
```

### Database Schema (`shared/schema.ts`)

#### Core Tables
- `users` - User accounts with roles
- `company_settings` - Business configuration
- `clients` - Customer information
- `invoices` - Billing records
- `invoice_items` - Line items for invoices
- `payments` - Payment transactions
- `jobs` - Electrical work orders
- `work_orders` - Detailed job specifications
- `bookings` - Appointment scheduling
- `sales_leads` - Sales pipeline
- `sales_activities` - Lead tracking
- `marketing_content` - AI-generated content
- `permits` - Electrical permits
- `inspections` - Code inspections
- `compliance_checklists` - TDLR/NEC compliance
- `ai_agents` - AI automation agents
- `agent_conversations` - AI chat history
- `files` - Document storage metadata

---

## ⚙️ Development Rules

### 1. File Organization Rules

#### ✅ DO:
- Put pages in `client/src/pages/`
- Put reusable components in `client/src/components/`
- Put hooks in `client/src/hooks/`
- Put utilities in `client/src/lib/`
- Keep backend routes in `server/routes.ts`
- Keep database schema in `shared/schema.ts`

#### ❌ DON'T:
- Create duplicate files for similar pages
- Put business logic in page components (extract to hooks)
- Hardcode values that should be in environment variables
- Create new API patterns - follow existing conventions

### 2. Routing Rules

#### Adding a New Page

**Step 1**: Create page component in `client/src/pages/`
```typescript
// client/src/pages/my-new-page.tsx
export default function MyNewPage() {
  return <div>My New Page</div>;
}
```

**Step 2**: Import and add route in `client/src/App.tsx`
```typescript
// Import at top
import MyNewPage from "@/pages/my-new-page";

// Add route in Router component
<Route path="/my-new-page" component={MyNewPage} />
```

**Step 3**: Add to sidebar navigation in `client/src/components/app-sidebar.tsx`
```typescript
{
  title: "My New Page",
  url: "/my-new-page",
  icon: MyIcon,
  roles: ['admin', 'employee'], // Specify which roles can see it
}
```

### 3. Database Rules

#### ✅ DO:
- Use Drizzle ORM for all database operations
- Define types in `shared/schema.ts` for frontend/backend consistency
- Use `createInsertSchema` from `drizzle-zod` for validation
- Run `npm run db:push` to sync schema changes

#### ❌ DON'T:
- Write raw SQL queries (use Drizzle query builder)
- Change ID column types (serial ↔ varchar) - breaks existing data
- Manually write migrations - use `npm run db:push`

### 4. Authentication Rules

#### ✅ DO:
- Use `useAuth()` hook in frontend components
- Use `req.user` in backend routes
- Implement role checks for sensitive operations
- Redirect to `/auth` when session expires

#### ❌ DON'T:
- Store passwords in plain text
- Skip session validation
- Allow clients to access admin features
- Hardcode user credentials

### 5. Error Handling Rules

#### Frontend
```typescript
// Always wrap mutations in try/catch
try {
  await mutation.mutateAsync(data);
  toast({ title: "Success" });
} catch (error) {
  toast({ 
    title: "Error", 
    description: error.message,
    variant: "destructive" 
  });
}
```

#### Backend
```typescript
// Always use try/catch in routes
app.post('/api/endpoint', async (req, res) => {
  try {
    // ... operation
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});
```

### 6. UI/UX Rules

#### ✅ DO:
- Use Shadcn components from `@/components/ui/`
- Add `data-testid` to interactive elements
- Show loading states (`isLoading`, skeletons)
- Use `useToast()` for user feedback
- Follow dark mode design (default theme)

#### ❌ DON'T:
- Create custom components when Shadcn has equivalent
- Remove accessibility features
- Use light colors that don't work in dark mode
- Skip loading states

---

## 🚀 Adding New Features

### Checklist for New Feature

#### 1. Backend Setup
- [ ] Add database table/columns in `shared/schema.ts`
- [ ] Run `npm run db:push` to sync schema
- [ ] Create API routes in `server/routes.ts`
- [ ] Add role-based access control
- [ ] Test endpoints with curl/Postman

#### 2. Frontend Setup
- [ ] Create page component in `client/src/pages/`
- [ ] Add route in `client/src/App.tsx`
- [ ] Add to sidebar in `app-sidebar.tsx`
- [ ] Implement data fetching with React Query
- [ ] Add loading and error states
- [ ] Add form validation with Zod

#### 3. Testing
- [ ] Test all user roles (admin, employee, client)
- [ ] Test error scenarios
- [ ] Test on mobile/tablet views
- [ ] Verify no console errors
- [ ] Test with network throttling

#### 4. Documentation
- [ ] Update this document with new routes
- [ ] Add comments to complex code
- [ ] Update `replit.md` with changes

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read properties of null (reading 'useRef')"
**Solution**: Component trying to use hooks before context ready. Wrap in safety check:
```typescript
if (!user) return null;
```

### Issue: Port 5000 already in use
**Solution**: Kill process and restart
```bash
pkill -f "tsx server"
npm run dev
```

### Issue: Database schema out of sync
**Solution**: Push schema changes
```bash
npm run db:push
```

### Issue: React Query not refetching after mutation
**Solution**: Invalidate cache
```typescript
queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
```

---

## 📦 Key Dependencies

### Frontend
- `react` - UI library
- `wouter` - Routing (lightweight)
- `@tanstack/react-query` - Data fetching & caching
- `react-hook-form` + `zod` - Form handling & validation
- `shadcn/ui` - UI component library
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `@stripe/stripe-js` - Payment processing

### Backend
- `express` - Web framework
- `drizzle-orm` - Database ORM
- `passport` - Authentication
- `stripe` - Payment processing
- `openai` - AI integration
- `twilio` - SMS messaging
- `agentmail` - Email automation
- `pdfkit` - PDF generation

---

## 🎯 Quick Reference

### Common Commands
```bash
# Development
npm run dev              # Start dev server (port 5000)
npm run build            # Build for production
npm run start            # Run production server

# Database
npm run db:push          # Sync schema to database
npm run check            # TypeScript type checking

# Deployment
# Clean .replit file, then click Deploy in Replit
```

### Environment Variables (All in Replit Secrets)
- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption
- `STRIPE_SECRET_KEY` - Stripe payments
- `VITE_STRIPE_PUBLIC_KEY` - Stripe frontend
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `TWILIO_*` - SMS notifications
- `AI_INTEGRATIONS_OPENAI_API_KEY` - AI features

---

## 📝 Maintenance Notes

### Current Status
- ✅ Zero frontend errors
- ✅ All routes functional
- ✅ Role-based access working
- ✅ Error handling implemented
- ✅ Production-ready

### Known Limitations
- Voice activation requires microphone permissions
- PDF generation is server-side (requires backend)
- Google Drive integration requires user authorization

### Future Enhancements
- Consider moving `home.tsx` to archive or integrate
- Add rate limiting to API routes
- Implement Redis caching for performance
- Add comprehensive logging system

---

**End of ElectraPro Application Library**

For questions or issues, refer to:
- `replit.md` - Project overview
- `DEPLOYMENT_CONFIGURATION.md` - Deployment guide
- `design_guidelines.md` - UI/UX standards
