import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { AIAssistant } from "@/components/ai-assistant";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { NotificationsButton } from "@/components/notifications-button";
// import { SiteMascot } from "@/components/site-mascot"; // Disabled: professional mode
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RoleSwitchProvider, useRoleSwitch } from "@/contexts/RoleSwitchContext";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useEffect, useState } from "react";
import { registerServiceWorker, requestPersistentStorage } from "@/lib/pwa-register";

// Public Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";

// Dashboard Pages (Role-Specific)
import AdminDashboard from "@/pages/admin-dashboard";
import EmployeeDashboard from "@/pages/employee-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import CustomerPortal from "@/pages/customer-portal";

// Core Business Operations
import Invoices from "@/pages/invoices";
import Estimates from "@/pages/estimates";
import Clients from "@/pages/clients";
import Jobs from "@/pages/jobs";
import Payment from "@/pages/payment";

// Business Growth & Marketing
import Sales from "@/pages/sales";
import Marketing from "@/pages/marketing";
import Bookings from "@/pages/bookings";
import Referrals from "@/pages/referrals";

// Communication & AI
import Messages from "@/pages/messages";
import AIAgents from "@/pages/ai-agents";

// Compliance & Administration
import Compliance from "@/pages/compliance";
import Users from "@/pages/users";
import Settings from "@/pages/settings";

// Help & Documentation
import About from "@/pages/about";
import AdminGuide from "@/pages/admin-guide";
import EmployeeGuide from "@/pages/employee-guide";
import ClientGuide from "@/pages/client-guide";

// Vendors
import Vendors from "@/pages/vendors";
import VendorBorimex from "@/pages/vendor-borimex";
import VendorRegister from "@/pages/vendor-register";
import VendorSite from "@/pages/vendor-site";
import VendorProfile from "@/pages/vendor-profile";
import TGEElectrical from "@/pages/tge-electrical";

// Sykes & Sons Logistics Portal
import SykesLogin from "@/pages/sykes-login";
import SykesPortal from "@/pages/sykes-portal";

// T.G.E. Electrical Vendor Portal
import TGELogin from "@/pages/tge-login";
import TGEPortal from "@/pages/tge-portal";

// Loading Components
import { FullPageLoader } from "@/components/video-loader";

function RoleDashboard() {
  const { user } = useAuth();
  const { effectiveRole } = useRoleSwitch();
  
  // Use effectiveRole for role-based routing to support "view as" functionality
  const role = effectiveRole || user?.role;
  
  // Admin and high-level roles
  if (role === 'pirate_king' || role === 'admin') return <AdminDashboard />;
  
  // Staff roles (partners, captains, staff, vendors)
  if (role === 'partner' || role === 'staff_captain' || role === 'staff') return <EmployeeDashboard />;
  if (role === 'vendor') return <ClientDashboard />; // Vendors see invoice/job management
  
  // Client role (customers) see the sales portal
  if (role === 'client') return <CustomerPortal />;
  
  // Default fallback
  return <ClientDashboard />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return <FullPageLoader message="Loading..." />;
  }

  // Public routes for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={Auth} />
        <Route path="/vendor/register" component={VendorRegister} />
        <Route path="/contractor/:slug" component={VendorSite} />
        <Route path="/tge-electrical" component={TGEElectrical} />
      <Route path="/sykes" component={SykesLogin} />
      <Route path="/sykes-portal" component={SykesPortal} />
      <Route path="/tge" component={TGELogin} />
      <Route path="/tge-portal" component={TGEPortal} />
      <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated routes
  return (
    <Switch>
      {/* Dashboard - Role-Based */}
      <Route path="/" component={RoleDashboard} />
      
      {/* Client Portal Routes */}
      <Route path="/client-dashboard" component={ClientDashboard} />
      <Route path="/customer-portal" component={CustomerPortal} />
      
      {/* Core Business Operations */}
      <Route path="/invoices" component={Invoices} />
      <Route path="/estimates" component={Estimates} />
      <Route path="/clients" component={Clients} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/payment/:invoiceId" component={Payment} />
      
      {/* Business Growth */}
      <Route path="/sales" component={Sales} />
      <Route path="/marketing" component={Marketing} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/referrals" component={Referrals} />
      
      {/* Communication & AI */}
      <Route path="/messages" component={Messages} />
      <Route path="/ai-agents" component={AIAgents} />
      
      {/* Compliance & Administration */}
      <Route path="/compliance" component={Compliance} />
      <Route path="/users" component={Users} />
      <Route path="/settings" component={Settings} />
      
      {/* Help & Documentation */}
      <Route path="/about" component={About} />
      <Route path="/admin-guide" component={AdminGuide} />
      <Route path="/employee-guide" component={EmployeeGuide} />
      <Route path="/client-guide" component={ClientGuide} />
      
      {/* Vendors */}
      <Route path="/vendors" component={Vendors} />
      <Route path="/vendors/borimex" component={VendorBorimex} />
      <Route path="/vendor/register" component={VendorRegister} />
      <Route path="/vendor/profile" component={VendorProfile} />
      <Route path="/contractor/:slug" component={VendorSite} />
      <Route path="/tge-electrical" component={TGEElectrical} />

      <Route path="/sykes" component={SykesLogin} />
      <Route path="/sykes-portal" component={SykesPortal} />
      <Route path="/tge" component={TGELogin} />
      <Route path="/tge-portal" component={TGEPortal} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isSparkyOpen, setIsSparkyOpen] = useState(false);
  const [location] = useLocation();

  // Vendor portal routes render standalone (no TGE sidebar), regardless of auth state
  const isSykesRoute = location === "/sykes" || location.startsWith("/sykes-portal");
  const isTGEPortalRoute = location === "/tge" || location.startsWith("/tge-portal");

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Public pages and vendor portals render without TGE sidebar
  if (isLoading || !isAuthenticated || isSykesRoute || isTGEPortalRoute) {
    return <Router />;
  }

  // Authenticated pages render with sidebar and floating Sparky button
  return (
    <RoleSwitchProvider user={user}>
      <SidebarProvider style={style as React.CSSProperties}>
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden bg-background">
            <header className="premium-header flex h-16 items-center justify-between gap-4 px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="text-foreground/80 hover:text-primary transition-colors" />
                <div className="h-6 w-px bg-border/50" />
                <NotificationsButton />
              {user && <RoleSwitcher user={user} />}
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              <div className="mx-auto max-w-7xl">
                <Router />
              </div>
            </main>
          </div>
          <AIAssistant externalIsOpen={isSparkyOpen} externalSetIsOpen={setIsSparkyOpen} />
        <PWAInstallPrompt />
      </SidebarProvider>
    </RoleSwitchProvider>
  );
}

function App() {
  // Enable dark mode by default and register service worker
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Register service worker for PWA functionality
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('[App] PWA service worker ready');
        // Request persistent storage for better offline experience
        requestPersistentStorage();
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
