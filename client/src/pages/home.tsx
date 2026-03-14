import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  Building2, 
  Plus,
  UserPlus,
  ClipboardList,
  Receipt,
  ArrowRight,
  Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Invoice, Client, Job, Vendor } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    retry: false,
  });

  const { data: vendorProfile } = useQuery<Vendor>({
    queryKey: ["/api/vendor/my-profile"],
    retry: false,
    enabled: user?.role === 'vendor',
  });

  const { data: salesLeads } = useQuery({
    queryKey: ["/api/sales-leads"],
    retry: false,
    enabled: user?.role === 'admin' || user?.role === 'employee' || user?.role === 'vendor',
  });

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const totalRevenue = invoices?.reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;
  const paidRevenue = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total), 0) || 0;
  const pendingInvoices = invoices?.filter(inv => inv.status === 'sent' || inv.status === 'draft').length || 0;
  const activeJobs = jobs?.filter(job => job.status === 'scheduled' || job.status === 'in_progress').length || 0;
  const newLeads = Array.isArray(salesLeads) ? salesLeads.filter((lead: any) => lead.status === 'new').length : 0;

  const getRoleBadge = () => {
    const roleColors: Record<string, string> = {
      admin: "bg-red-500/20 text-red-400 border-red-500/30",
      vendor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      employee: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      client: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    const roleLabels: Record<string, string> = {
      admin: "Administrator",
      vendor: "Vendor Partner",
      employee: "Team Member",
      client: "Client",
      pirate_king: "Pirate King",
      partner: "Partner",
      staff_captain: "Staff Captain",
      staff: "Staff",
    };
    return (
      <Badge 
        variant="outline" 
        className={`${roleColors[user?.role || 'client'] || 'bg-gray-500/20 text-gray-400'} ml-2`}
        data-testid="badge-user-role"
      >
        {roleLabels[user?.role || 'client'] || user?.role}
      </Badge>
    );
  };

  const getDataContextLabel = () => {
    if (user?.role === 'admin' || user?.role === 'pirate_king') {
      return "Viewing all company data";
    } else if (user?.role === 'vendor') {
      return vendorProfile ? `Your ${vendorProfile.name} business data` : "Your business data";
    } else if (user?.role === 'employee' || user?.role === 'staff') {
      return "Your assigned work";
    }
    return "Your personal data";
  };

  const isServicePro = ['admin', 'vendor', 'employee', 'staff', 'pirate_king', 'partner', 'staff_captain'].includes(user?.role || '');

  return (
    <div className="space-y-8" data-testid="container-home">
      <div data-testid="section-header">
        <div className="flex items-center flex-wrap gap-2">
          <h1 className="text-3xl font-bold" data-testid="text-welcome">Welcome back, {user?.name}!</h1>
          {getRoleBadge()}
        </div>
        <p className="text-muted-foreground mt-1" data-testid="text-description">
          {getDataContextLabel()}
        </p>
      </div>

      {user?.role === 'vendor' && vendorProfile && (
        <Card className="border-yellow-500/30 bg-yellow-500/5" data-testid="card-vendor-profile-summary">
          <CardHeader className="pb-3" data-testid="card-header-vendor">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-yellow-400" />
              <div>
                <CardTitle className="text-lg" data-testid="text-vendor-name">{vendorProfile.name}</CardTitle>
                <CardDescription data-testid="text-vendor-category">{vendorProfile.service_category}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent data-testid="card-content-vendor-info">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium" data-testid="text-vendor-phone">{vendorProfile.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium truncate" data-testid="text-vendor-email">{vendorProfile.email}</p>
              </div>
              {vendorProfile.website_slug && (
                <div>
                  <span className="text-muted-foreground">Website:</span>
                  <p className="font-medium text-yellow-400" data-testid="text-vendor-website">/contractor/{vendorProfile.website_slug}</p>
                </div>
              )}
              {vendorProfile.rating && (
                <div>
                  <span className="text-muted-foreground">Rating:</span>
                  <p className="font-medium" data-testid="text-vendor-rating">{vendorProfile.rating}/5</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions for Service Professionals */}
      {isServicePro && (
        <div data-testid="section-quick-actions">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/clients">
              <Card className="hover-elevate cursor-pointer group" data-testid="quick-action-new-client">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                    <UserPlus className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="font-medium text-sm">Add Client</h3>
                  <p className="text-xs text-muted-foreground">New customer</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/invoices">
              <Card className="hover-elevate cursor-pointer group" data-testid="quick-action-new-invoice">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                    <Receipt className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="font-medium text-sm">New Invoice</h3>
                  <p className="text-xs text-muted-foreground">Create & send</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/jobs">
              <Card className="hover-elevate cursor-pointer group" data-testid="quick-action-schedule-job">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                    <Calendar className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="font-medium text-sm">Schedule Job</h3>
                  <p className="text-xs text-muted-foreground">Book appointment</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/sales">
              <Card className="hover-elevate cursor-pointer group" data-testid="quick-action-view-leads">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                    <ClipboardList className="h-6 w-6 text-orange-400" />
                  </div>
                  <h3 className="font-medium text-sm">Sales Leads</h3>
                  <p className="text-xs text-muted-foreground">
                    {newLeads > 0 ? `${newLeads} new` : 'View pipeline'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* Alerts / Notifications */}
      {isServicePro && newLeads > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5" data-testid="card-new-leads-alert">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium">You have {newLeads} new service request{newLeads > 1 ? 's' : ''}!</p>
                <p className="text-sm text-muted-foreground">Respond within 24 hours for best results</p>
              </div>
            </div>
            <Link href="/sales">
              <Button size="sm" className="gap-1" data-testid="button-view-leads">
                View Leads <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-testid="grid-stats">
        <Card data-testid="card-stat-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2" data-testid="card-header-revenue">
            <CardTitle className="text-sm font-medium" data-testid="text-label-revenue">
              {user?.role === 'vendor' ? 'My Revenue' : 'Total Revenue'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" data-testid="icon-revenue" />
          </CardHeader>
          <CardContent data-testid="card-content-revenue">
            <div className="text-2xl font-bold text-green-400" data-testid="text-total-revenue">${paidRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground" data-testid="text-revenue-period">
              ${(totalRevenue - paidRevenue).toFixed(2)} pending
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-invoices">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2" data-testid="card-header-invoices">
            <CardTitle className="text-sm font-medium" data-testid="text-label-invoices">
              {user?.role === 'vendor' ? 'My Invoices' : 'Pending Invoices'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" data-testid="icon-invoices" />
          </CardHeader>
          <CardContent data-testid="card-content-invoices">
            <div className="text-2xl font-bold" data-testid="text-pending-invoices">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground" data-testid="text-invoices-description">
              {invoices?.length || 0} total invoices
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-jobs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2" data-testid="card-header-jobs">
            <CardTitle className="text-sm font-medium" data-testid="text-label-jobs">
              {user?.role === 'vendor' ? 'My Jobs' : 'Active Jobs'}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" data-testid="icon-jobs" />
          </CardHeader>
          <CardContent data-testid="card-content-jobs">
            <div className="text-2xl font-bold" data-testid="text-active-jobs">{activeJobs}</div>
            <p className="text-xs text-muted-foreground" data-testid="text-jobs-description">
              {jobs?.length || 0} total jobs
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-clients">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2" data-testid="card-header-clients">
            <CardTitle className="text-sm font-medium" data-testid="text-label-clients">
              {user?.role === 'vendor' ? 'My Clients' : 'Total Clients'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" data-testid="icon-clients" />
          </CardHeader>
          <CardContent data-testid="card-content-clients">
            <div className="text-2xl font-bold" data-testid="text-total-clients">{clients?.length || 0}</div>
            <p className="text-xs text-muted-foreground" data-testid="text-clients-description">
              {user?.role === 'vendor' ? 'In your CRM' : 'All clients'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2" data-testid="grid-recent-activity">
        <Card data-testid="card-recent-invoices">
          <CardHeader data-testid="card-header-recent-invoices">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle data-testid="text-title-recent-invoices">
                    {user?.role === 'vendor' ? 'My Recent Invoices' : 'Recent Invoices'}
                  </CardTitle>
                  <CardDescription data-testid="text-description-recent-invoices">
                    {user?.role === 'vendor' ? 'Invoices you created' : 'Your latest invoices'}
                  </CardDescription>
                </div>
              </div>
              <Link href="/invoices">
                <Button size="sm" variant="ghost" className="gap-1" data-testid="button-view-all-invoices">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent data-testid="card-content-recent-invoices">
            {invoices && invoices.length > 0 ? (
              <div className="space-y-4" data-testid="list-recent-invoices">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0" data-testid={`row-invoice-${invoice.id}`}>
                    <div data-testid={`container-invoice-info-${invoice.id}`}>
                      <div className="font-medium" data-testid={`text-invoice-number-${invoice.id}`}>{invoice.invoice_number}</div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          invoice.status === 'paid' ? 'text-green-400 border-green-500/30' :
                          invoice.status === 'sent' ? 'text-blue-400 border-blue-500/30' :
                          'text-muted-foreground'
                        }`}
                        data-testid={`badge-invoice-status-${invoice.id}`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="font-bold" data-testid={`text-invoice-total-${invoice.id}`}>${parseFloat(invoice.total).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="text-no-invoices">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No invoices yet</p>
                <p className="text-xs text-muted-foreground">Create your first invoice to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-jobs">
          <CardHeader data-testid="card-header-upcoming-jobs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle data-testid="text-title-upcoming-jobs">
                    {user?.role === 'vendor' ? 'My Upcoming Jobs' : 'Upcoming Jobs'}
                  </CardTitle>
                  <CardDescription data-testid="text-description-upcoming-jobs">
                    {user?.role === 'vendor' ? 'Your scheduled appointments' : 'Scheduled appointments'}
                  </CardDescription>
                </div>
              </div>
              <Link href="/jobs">
                <Button size="sm" variant="ghost" className="gap-1" data-testid="button-view-all-jobs">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent data-testid="card-content-upcoming-jobs">
            {jobs && jobs.length > 0 ? (
              <div className="space-y-4" data-testid="list-upcoming-jobs">
                {jobs.filter(j => j.status !== 'completed').slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0" data-testid={`row-job-${job.id}`}>
                    <div data-testid={`container-job-info-${job.id}`}>
                      <div className="font-medium" data-testid={`text-job-title-${job.id}`}>{job.title}</div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          job.status === 'in_progress' ? 'text-yellow-400 border-yellow-500/30' :
                          job.status === 'scheduled' ? 'text-blue-400 border-blue-500/30' :
                          'text-muted-foreground'
                        }`}
                        data-testid={`badge-job-status-${job.id}`}
                      >
                        {job.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    {job.scheduled_date && (
                      <div className="text-sm text-muted-foreground" data-testid={`text-job-date-${job.id}`}>
                        {new Date(job.scheduled_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="text-no-jobs">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming jobs</p>
                <p className="text-xs text-muted-foreground">Schedule a job to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
