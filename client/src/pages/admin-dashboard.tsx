import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Clock,
  AlertCircle,
  CheckCircle2,
  Mic,
  Phone,
  Mail
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QuickAction {
  title: string;
  icon: any;
  href: string;
  testId: string;
  voicePrompt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [voiceListening, setVoiceListening] = useState<string | null>(null);
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: recentInvoices = [] } = useQuery({
    queryKey: ['/api/invoices/recent'],
    queryFn: async () => {
      const response = await fetch('/api/invoices/recent?limit=5');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    },
  });

  const { data: recentJobs = [] } = useQuery({
    queryKey: ['/api/jobs/recent'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/recent?limit=5');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const quickActions: QuickAction[] = [
    {
      title: "Create Invoice",
      icon: FileText,
      href: "/invoices",
      testId: "button-create-invoice",
      voicePrompt: "Tell me the client name, services provided, and amounts for the invoice"
    },
    {
      title: "Schedule Job",
      icon: Briefcase,
      href: "/jobs",
      testId: "button-schedule-job",
      voicePrompt: "Say the client name, job type, and preferred date for scheduling"
    },
    {
      title: "Add Client",
      icon: Users,
      href: "/clients",
      testId: "button-add-client",
      voicePrompt: "Provide the client name, email, phone number, and address"
    },
    {
      title: "Compliance Check",
      icon: AlertCircle,
      href: "/compliance",
      testId: "button-compliance-check",
      voicePrompt: "What compliance items would you like to review or check?"
    }
  ];

  const startVoicePrompt = (actionTitle: string, voicePrompt: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Voice recognition not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    setVoiceListening(actionTitle);

    recognition.onstart = () => {
      toast({
        title: `🎤 ${actionTitle}`,
        description: voicePrompt,
        duration: 3000
      });
    };

    recognition.onend = () => {
      setVoiceListening(null);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        setVoiceListening(null);
        toast({
          title: "Voice Error",
          description: "Failed to capture voice input",
          variant: "destructive"
        });
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setVoiceListening(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-admin-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">All systems operational</span>
        </div>
      </div>

      {/* Key Metrics - Premium Stat Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card p-5" data-testid="card-total-clients">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
              <div className="text-3xl font-bold stat-number text-foreground">{stats?.totalClients || 0}</div>
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </div>
            <div className="glow-icon">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card p-5" data-testid="card-active-jobs">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
              <div className="text-3xl font-bold stat-number text-foreground">{stats?.activeJobs || 0}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </div>
            <div className="glow-icon">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card p-5" data-testid="card-pending-invoices">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Pending Invoices</p>
              <div className="text-3xl font-bold stat-number text-foreground">{stats?.pendingInvoices || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </div>
            <div className="glow-icon">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card p-5" data-testid="card-monthly-revenue">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              <div className="text-3xl font-bold stat-number text-primary">
                ${stats?.monthlyRevenue ? parseFloat(stats.monthlyRevenue).toLocaleString() : '0'}
              </div>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                This month
              </p>
            </div>
            <div className="glow-icon">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Invoices */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 p-5 border-b border-white/5">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Recent Invoices</h3>
              <p className="text-sm text-muted-foreground">Latest billing activity</p>
            </div>
            <Link href="/invoices">
              <Button variant="outline" size="sm" className="gradient-border-btn rounded-lg" data-testid="button-view-all-invoices">
                View All
              </Button>
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent invoices</p>
            ) : (
              recentInvoices.map((invoice: any) => (
                <div key={invoice.id} className="p-4 rounded-xl bg-background/50 border border-white/5 space-y-3 hover:border-primary/20 transition-colors" data-testid={`card-invoice-${invoice.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-sm text-primary" data-testid={`text-invoice-number-${invoice.id}`}>
                        {invoice.invoice_number}
                      </p>
                      <p className="font-medium text-sm text-foreground" data-testid={`text-client-name-${invoice.id}`}>
                        {invoice.client_name}
                      </p>
                    </div>
                    <Badge className={invoice.status === 'paid' ? 'electric-badge' : 'blue-badge'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {invoice.client_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-primary/60" />
                        <span data-testid={`text-phone-${invoice.id}`}>{invoice.client_phone}</span>
                      </div>
                    )}
                    {invoice.client_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-primary/60" />
                        <span data-testid={`text-email-${invoice.id}`} className="truncate">{invoice.client_email}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <p className="font-bold text-lg text-primary">
                      ${parseFloat(invoice.total).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 p-5 border-b border-white/5">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Recent Jobs</h3>
              <p className="text-sm text-muted-foreground">Current project status</p>
            </div>
            <Link href="/jobs">
              <Button variant="outline" size="sm" className="gradient-border-btn rounded-lg" data-testid="button-view-all-jobs">
                View All
              </Button>
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent jobs</p>
            ) : (
              recentJobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-white/5 hover:border-primary/20 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{job.client_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {job.status === 'in_progress' && <Clock className="h-5 w-5 text-accent" />}
                    {job.status === 'scheduled' && <Clock className="h-5 w-5 text-orange-500" />}
                    <Badge className={job.status === 'completed' ? 'electric-badge' : 'blue-badge'}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold text-lg text-foreground">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">Common administrative tasks</p>
        </div>
        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <div key={action.testId} className="action-card group">
                <Link href={action.href} className="block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors" data-testid={action.testId}>
                      {action.title}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs border border-white/5 rounded-lg hover:border-primary/30 hover:bg-primary/10"
                  onClick={() => startVoicePrompt(action.title, action.voicePrompt)}
                  disabled={voiceListening === action.title}
                  data-testid={`button-voice-${action.testId}`}
                >
                  <Mic className={`h-3 w-3 mr-1 ${voiceListening === action.title ? 'animate-pulse text-primary' : ''}`} />
                  {voiceListening === action.title ? 'Listening...' : 'Voice Command'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
