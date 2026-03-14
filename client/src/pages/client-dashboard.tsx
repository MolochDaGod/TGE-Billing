import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  DollarSign, 
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Zap,
  MessageSquare,
  Wrench,
  ArrowRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: myInvoices = [] } = useQuery({
    queryKey: ['/api/invoices/my-invoices'],
    queryFn: async () => {
      const response = await fetch('/api/invoices/my-invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    },
  });

  const { data: myJobs = [] } = useQuery({
    queryKey: ['/api/jobs/my-jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/my-jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const pendingInvoices = myInvoices.filter((inv: any) => inv.status === 'pending' || inv.status === 'sent');
  const paidInvoices = myInvoices.filter((inv: any) => inv.status === 'paid');
  const totalOutstanding = pendingInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total || 0), 0);

  const upcomingJobs = myJobs.filter((job: any) => job.status === 'scheduled');
  const activeJobs = myJobs.filter((job: any) => job.status === 'in_progress');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-client-dashboard-title">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Manage your electrical services and payments</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-outstanding-balance">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalOutstanding.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{pendingInvoices.length} pending invoice(s)</p>
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-jobs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingJobs.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled appointments</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-jobs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Pending Invoices</CardTitle>
            <CardDescription>Invoices awaiting payment</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingInvoices.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending invoices - you're all paid up!</p>
            </div>
          ) : (
            pendingInvoices.map((invoice: any) => (
              <Card key={invoice.id} className="hover-elevate cursor-pointer" data-testid={`invoice-${invoice.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{invoice.invoice_number}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{invoice.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>
                        <Badge variant={invoice.status === 'sent' ? 'destructive' : 'secondary'} className="text-xs">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary mb-2">
                        ${parseFloat(invoice.total).toLocaleString()}
                      </p>
                      <Button 
                        size="sm" 
                        onClick={() => setLocation(`/payment/${invoice.id}`)}
                        data-testid={`button-pay-invoice-${invoice.id}`}
                      >
                        <CreditCard className="mr-2 h-3 w-3" />
                        Pay Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent paid invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {paidInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment history yet</p>
          ) : (
            paidInvoices.slice(0, 5).map((invoice: any) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{invoice.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">
                    Paid: {format(new Date(invoice.paid_date || invoice.updated_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm">
                      ${parseFloat(invoice.total).toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled electrical services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingJobs.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(job.scheduled_date), 'EEEE, MMM d, yyyy - h:mm a')}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Request Service - Prominent CTA */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Need Electrical Work?</h3>
                <p className="text-sm text-muted-foreground">Request a quote or schedule a service call today</p>
              </div>
            </div>
            <Link href="/customer-portal">
              <Button size="lg" data-testid="button-request-service">
                <Wrench className="mr-2 h-4 w-4" />
                Request Service
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Link href="/booking">
          <Card className="hover-elevate cursor-pointer h-full" data-testid="card-book-appointment">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Book Appointment</p>
                <p className="text-xs text-muted-foreground">Schedule your next visit</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/referrals">
          <Card className="hover-elevate cursor-pointer h-full" data-testid="card-refer-friend">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Refer a Friend</p>
                <p className="text-xs text-muted-foreground">Earn rewards</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <a href="tel:2814164454">
          <Card className="hover-elevate cursor-pointer h-full" data-testid="card-call-now">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Phone className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">Call Now</p>
                <p className="text-xs text-muted-foreground">(281) 416-4454</p>
              </div>
            </CardContent>
          </Card>
        </a>
        
        <Link href="/sparky">
          <Card className="hover-elevate cursor-pointer h-full" data-testid="card-ask-sparky">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/10">
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Ask Sparky AI</p>
                <p className="text-xs text-muted-foreground">24/7 assistant</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alert for overdue invoices */}
      {pendingInvoices.some((inv: any) => new Date(inv.due_date) < new Date()) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Overdue Invoice Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You have one or more overdue invoices. Please make payment as soon as possible to avoid service interruption.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
