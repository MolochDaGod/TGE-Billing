import { 
  Home, 
  FileText, 
  Users, 
  Calendar, 
  Megaphone, 
  Settings,
  LogOut,
  Zap,
  Info,
  BookOpen,
  Shield,
  Bot,
  TrendingUp,
  Share2,
  MessageSquare,
  ClipboardList,
  Building2,
  Sparkles,
  Gift
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRoleSwitch } from "@/contexts/RoleSwitchContext";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import tgeLogo from "@assets/tgelogo_1763888346781.webp";

export function AppSidebar() {
  const { user } = useAuth();
  const { effectiveRole } = useRoleSwitch();
  const [location] = useLocation();
  
  // Use effectiveRole for navigation (supports "view as" functionality)
  const role = effectiveRole || user?.role;

  // Admin Navigation - Full Access
  const adminOperationsItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Invoices", url: "/invoices", icon: FileText },
    { title: "Clients", url: "/clients", icon: Users },
    { title: "Jobs", url: "/jobs", icon: Calendar },
    { title: "Compliance", url: "/compliance", icon: Shield },
  ];

  const adminGrowthItems = [
    { title: "Sales Pipeline", url: "/sales", icon: TrendingUp },
    { title: "Bookings", url: "/bookings", icon: ClipboardList },
    { title: "Marketing", url: "/marketing", icon: Megaphone },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "AI Agents", url: "/ai-agents", icon: Bot },
  ];

  const adminSystemItems = [
    { title: "Users", url: "/users", icon: Users },
    { title: "Vendors", url: "/vendors", icon: Building2 },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  // Employee Navigation - Operations Focus
  const employeeOperationsItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Invoices", url: "/invoices", icon: FileText },
    { title: "Clients", url: "/clients", icon: Users },
    { title: "Jobs", url: "/jobs", icon: Calendar },
    { title: "Compliance", url: "/compliance", icon: Shield },
  ];

  const employeeGrowthItems = [
    { title: "Sales Pipeline", url: "/sales", icon: TrendingUp },
    { title: "Bookings", url: "/bookings", icon: ClipboardList },
    { title: "Marketing", url: "/marketing", icon: Megaphone },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "AI Agents", url: "/ai-agents", icon: Bot },
    { title: "Vendors", url: "/vendors", icon: Building2 },
  ];

  // Vendor Navigation - Service Provider View
  const vendorItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "My Profile", url: "/vendor/profile", icon: Building2 },
    { title: "My Clients", url: "/clients", icon: Users },
    { title: "My Invoices", url: "/invoices", icon: FileText },
    { title: "My Jobs", url: "/jobs", icon: Calendar },
    { title: "Bookings", url: "/bookings", icon: ClipboardList },
  ];

  // Client Navigation - Customer Portal (Sales/Onboarding)
  const clientItems = [
    { title: "My Dashboard", url: "/client-dashboard", icon: Home },
    { title: "Request Service", url: "/customer-portal", icon: MessageSquare },
    { title: "My Invoices", url: "/invoices", icon: FileText },
    { title: "Referrals", url: "/referrals", icon: Gift },
    { title: "About Us", url: "/about", icon: Info },
  ];

  // Partner-only System items (partners co-manage the business)
  const partnerSystemItems = [
    { title: "Users", url: "/users", icon: Users },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  // Vendor additional items
  const vendorAIItems = [
    { title: "AI Agents", url: "/ai-agents", icon: Bot },
  ];

  const getHelpItems = () => {
    const commonItems = [
      { title: "About", url: "/about", icon: Info },
    ];
    
    // Admin roles
    if (role === 'pirate_king' || role === 'admin') {
      return [...commonItems, { title: "Admin Guide", url: "/admin-guide", icon: BookOpen }];
    }
    
    // Staff roles
    if (role === 'partner' || role === 'staff_captain' || role === 'staff') {
      return [...commonItems, { title: "Employee Guide", url: "/employee-guide", icon: BookOpen }];
    }
    
    // Vendor role
    if (role === 'vendor') {
      return [...commonItems, { title: "Vendor Guide", url: "/client-guide", icon: BookOpen }];
    }
    
    // Client role (customers)
    if (role === 'client') {
      return commonItems; // Just show About, they're new customers
    }
    
    // Default
    return [...commonItems, { title: "Client Guide", url: "/client-guide", icon: BookOpen }];
  };

  const helpItems = getHelpItems();

  return (
    <Sidebar className="premium-sidebar border-r-0">
      <SidebarHeader className="p-5 border-b border-primary/15">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <img 
                src={tgeLogo} 
                alt="T.G.E. PROS Logo" 
                className="h-10 w-auto drop-shadow-lg"
                data-testid="img-sidebar-logo"
              />
            </div>
          </div>
          <div>
            <div className="font-bold text-lg electric-text tracking-wide">T.G.E. PROS</div>
            <div className="text-xs text-muted-foreground font-medium">Licensed Contractor Platform</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Admin Roles (Pirate King, Admin) */}
        {(role === 'pirate_king' || role === 'admin') && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminOperationsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Business Growth</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminGrowthItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminSystemItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Staff Roles (Partner, Staff Captain, Staff) */}
        {(role === 'partner' || role === 'staff_captain' || role === 'staff') && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {employeeOperationsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Business Growth</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {employeeGrowthItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Partners also get System access (Users + Settings) */}
            {role === 'partner' && (
              <SidebarGroup>
                <SidebarGroupLabel>System</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {partnerSystemItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}

        {/* Vendor Role (Service Providers) */}
        {role === 'vendor' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>My Work</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {vendorItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {vendorAIItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Client Role (Customers - Sales Portal) */}
        {role === 'client' && (
          <SidebarGroup>
            <SidebarGroupLabel>Customer Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clientItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        <SidebarGroup>
          <SidebarGroupLabel>Help & Info</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {helpItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-primary/15">
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl glass-card">
          <Avatar className="h-10 w-10 ring-2 ring-primary/30 shadow-lg">
            <AvatarImage src={user?.avatar_url || undefined} alt={user?.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold truncate text-foreground">{user?.name}</div>
            <div className="text-xs text-primary/80 truncate capitalize font-medium">{effectiveRole || user?.role}</div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className="w-full gradient-border-btn rounded-xl text-foreground hover:text-primary transition-colors" 
          data-testid="button-logout"
        >
          <a href="/api/logout">
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </a>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
