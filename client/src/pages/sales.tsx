import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, Plus, Phone, Mail, DollarSign, Loader2, Zap, ClipboardList, 
  Users, FileText, Search, Filter, MoreVertical, CheckCircle2, XCircle,
  Clock, Target, ArrowRight, Calendar, Building2, User, Sparkles,
  TrendingDown, AlertCircle, Trophy, Handshake, Eye
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { SalesLead } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PIPELINE_STAGES = [
  { id: "new", label: "New Leads", color: "bg-blue-500", icon: Sparkles, description: "Fresh inquiries" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-500", icon: Phone, description: "Initial outreach made" },
  { id: "qualified", label: "Qualified", color: "bg-orange-500", icon: Target, description: "Needs confirmed" },
  { id: "proposal", label: "Proposal", color: "bg-purple-500", icon: FileText, description: "Quote sent" },
  { id: "negotiation", label: "Negotiation", color: "bg-pink-500", icon: Handshake, description: "Terms discussion" },
  { id: "won", label: "Won", color: "bg-green-500", icon: Trophy, description: "Deal closed" },
  { id: "lost", label: "Lost", color: "bg-red-500", icon: XCircle, description: "Opportunity lost" },
];

const QUICK_LEAD_TEMPLATES = [
  {
    id: "service_call",
    name: "Service Call Lead",
    icon: Phone,
    description: "Quick lead from incoming call",
    defaults: { source: "phone", status: "new", estimated_value: "250" }
  },
  {
    id: "estimate_request",
    name: "Estimate Request",
    icon: ClipboardList,
    description: "Customer requesting a quote",
    defaults: { source: "website", status: "new", estimated_value: "1500" }
  },
  {
    id: "referral",
    name: "Referral Lead",
    icon: Users,
    description: "Lead from existing customer",
    defaults: { source: "referral", status: "qualified", estimated_value: "2000" }
  },
  {
    id: "commercial",
    name: "Commercial Project",
    icon: FileText,
    description: "Business/commercial inquiry",
    defaults: { source: "direct", status: "new", estimated_value: "5000" }
  },
];

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone Call" },
  { value: "referral", label: "Referral" },
  { value: "direct", label: "Direct/Walk-in" },
  { value: "social", label: "Social Media" },
  { value: "advertising", label: "Advertising" },
  { value: "existing_contract", label: "Existing Contract" },
  { value: "other", label: "Other" },
];

function normalizeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'won',
    'closed': 'won',
    'converted': 'won',
    'canceled': 'lost',
    'cancelled': 'lost',
  };
  return statusMap[status.toLowerCase()] || status.toLowerCase();
}

export default function SalesPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [quickLeadTemplate, setQuickLeadTemplate] = useState<typeof QUICK_LEAD_TEMPLATES[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");

  const { data: leads = [], isLoading } = useQuery<SalesLead[]>({
    queryKey: ['/api/sales-leads'],
  });

  const normalizedLeads = leads.map(lead => ({
    ...lead,
    status: normalizeStatus(lead.status)
  }));

  const filteredLeads = normalizedLeads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);
    const matchesSource = filterSource === "all" || lead.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const pipeline: Record<string, SalesLead[]> = {};
  PIPELINE_STAGES.forEach(stage => {
    pipeline[stage.id] = filteredLeads.filter(l => l.status === stage.id);
  });

  const activeLeads = filteredLeads.filter(l => !['won', 'lost'].includes(l.status));
  const wonLeads = filteredLeads.filter(l => l.status === 'won');
  const lostLeads = filteredLeads.filter(l => l.status === 'lost');

  const totalValue = filteredLeads.reduce((sum, lead) => sum + parseFloat(lead.estimated_value || "0"), 0);
  const wonValue = wonLeads.reduce((sum, lead) => sum + parseFloat(lead.estimated_value || "0"), 0);
  const pipelineValue = activeLeads.reduce((sum, lead) => sum + parseFloat(lead.estimated_value || "0"), 0);
  
  const conversionRate = leads.length > 0 
    ? Math.round((wonLeads.length / leads.length) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Track leads through your sales process
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-lead">
                <Plus className="mr-2 h-4 w-4" />
                New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
                <DialogDescription>
                  Add a new sales lead to the pipeline
                </DialogDescription>
              </DialogHeader>
              <CreateLeadForm onSuccess={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeads.length}</div>
            <p className="text-xs text-muted-foreground">${pipelineValue.toLocaleString()} value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{wonLeads.length}</div>
            <p className="text-xs text-muted-foreground">${wonValue.toLocaleString()} closed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <Progress value={conversionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lostLeads.length}</div>
            <p className="text-xs text-muted-foreground">Opportunities missed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 bg-[#000000a1] rounded-t-xl">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Quick Lead Actions</CardTitle>
          </div>
          <CardDescription>Fast-track lead creation with pre-configured templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_LEAD_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate bg-[#00000075]"
                onClick={() => setQuickLeadTemplate(template)}
                data-testid={`button-quick-${template.id}`}
              >
                <template.icon className="h-6 w-6 text-primary" />
                <span className="font-medium text-sm">{template.name}</span>
                <span className="text-xs text-muted-foreground text-center">{template.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {quickLeadTemplate && (
        <Dialog open={!!quickLeadTemplate} onOpenChange={() => setQuickLeadTemplate(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <quickLeadTemplate.icon className="h-5 w-5 text-primary" />
                {quickLeadTemplate.name}
              </DialogTitle>
              <DialogDescription>
                {quickLeadTemplate.description} - Fill in customer details below
              </DialogDescription>
            </DialogHeader>
            <CreateLeadForm 
              onSuccess={() => setQuickLeadTemplate(null)} 
              defaultValues={quickLeadTemplate.defaults}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-leads"
            />
          </div>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-source">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "pipeline" | "list")}>
          <TabsList>
            <TabsTrigger value="pipeline" data-testid="tab-pipeline-view">
              <Target className="h-4 w-4 mr-2" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list-view">
              <ClipboardList className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "pipeline" ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map((stage) => (
              <PipelineColumn 
                key={stage.id}
                stage={stage}
                leads={pipeline[stage.id] || []}
                onLeadClick={setSelectedLead}
                allLeads={normalizedLeads}
              />
            ))}
          </div>
        </div>
      ) : (
        <LeadListView leads={filteredLeads} onLeadClick={setSelectedLead} />
      )}

      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedLead.name}
              </DialogTitle>
              <DialogDescription>Lead Details and Management</DialogDescription>
            </DialogHeader>
            <LeadDetailView lead={selectedLead} onClose={() => setSelectedLead(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PipelineColumn({ 
  stage, 
  leads, 
  onLeadClick,
  allLeads 
}: { 
  stage: typeof PIPELINE_STAGES[0]; 
  leads: SalesLead[]; 
  onLeadClick: (lead: SalesLead) => void;
  allLeads: SalesLead[];
}) {
  const stageValue = leads.reduce((sum, lead) => sum + parseFloat(lead.estimated_value || "0"), 0);
  const Icon = stage.icon;

  return (
    <Card className="w-72 flex-shrink-0 bg-[#1a1a1a] border-zinc-700">
      <CardHeader className="pb-2 bg-[#000000cc] rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${stage.color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-white">{stage.label}</CardTitle>
              <p className="text-xs text-zinc-400">{stage.description}</p>
            </div>
          </div>
          <Badge className="bg-zinc-700 text-white border-none">{leads.length}</Badge>
        </div>
        {stageValue > 0 && (
          <p className="text-xs text-green-400 font-medium mt-1">
            ${stageValue.toLocaleString()} potential
          </p>
        )}
      </CardHeader>
      <CardContent className="bg-[#1a1a1a] rounded-b-xl">
        <ScrollArea className="h-[400px] pr-3">
          <div className="space-y-3">
            {leads.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No leads</p>
            ) : (
              leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function LeadCard({ lead, onClick }: { lead: SalesLead; onClick: () => void }) {
  const { toast } = useToast();
  
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/sales-leads/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-leads'] });
      toast({ title: "Lead updated", description: "Lead status changed successfully" });
    },
  });

  const getNextStages = () => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === lead.status);
    return PIPELINE_STAGES.slice(currentIndex + 1).filter(s => s.id !== 'lost');
  };

  return (
    <Card 
      className="hover-elevate cursor-pointer group bg-[#252525] border-zinc-600 shadow-md"
      data-testid={`lead-card-${lead.id}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-sm leading-tight text-white" onClick={onClick}>{lead.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-white hover:bg-zinc-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
              <DropdownMenuItem onClick={onClick} className="text-white hover:bg-zinc-700">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-700" />
              {getNextStages().map(stage => (
                <DropdownMenuItem 
                  key={stage.id}
                  onClick={() => updateLeadMutation.mutate({ id: lead.id, status: stage.id })}
                  className="text-white hover:bg-zinc-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move to {stage.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem 
                onClick={() => updateLeadMutation.mutate({ id: lead.id, status: 'won' })}
                className="text-green-400 hover:bg-zinc-700"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Mark as Won
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => updateLeadMutation.mutate({ id: lead.id, status: 'lost' })}
                className="text-red-400 hover:bg-zinc-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark as Lost
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-1" onClick={onClick}>
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap" onClick={onClick}>
          {lead.estimated_value && parseFloat(lead.estimated_value) > 0 && (
            <Badge className="text-green-400 border-green-600 bg-green-950 border">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {parseFloat(lead.estimated_value).toLocaleString()}
            </Badge>
          )}
          {lead.source && (
            <Badge className="text-xs bg-zinc-700 text-zinc-200 border-none">
              {SOURCE_OPTIONS.find(s => s.value === lead.source)?.label || lead.source}
            </Badge>
          )}
        </div>

        {lead.created_at && (
          <p className="text-xs text-zinc-400 pt-1" onClick={onClick}>
            <Clock className="h-3 w-3 inline mr-1" />
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LeadListView({ leads, onLeadClick }: { leads: SalesLead[]; onLeadClick: (lead: SalesLead) => void }) {
  return (
    <Card className="bg-[#1a1a1a] border-zinc-700">
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-700">
          {leads.length === 0 ? (
            <p className="text-center text-zinc-400 py-8">No leads found</p>
          ) : (
            leads.map((lead) => (
              <div 
                key={lead.id}
                className="flex items-center justify-between p-4 hover:bg-zinc-800 cursor-pointer"
                onClick={() => onLeadClick(lead)}
                data-testid={`lead-row-${lead.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{lead.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      {lead.email && <span>{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {lead.estimated_value && parseFloat(lead.estimated_value) > 0 && (
                    <span className="font-semibold text-green-400">
                      ${parseFloat(lead.estimated_value).toLocaleString()}
                    </span>
                  )}
                  <Badge className={PIPELINE_STAGES.find(s => s.id === lead.status)?.color || "bg-gray-500"}>
                    {PIPELINE_STAGES.find(s => s.id === lead.status)?.label || lead.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LeadDetailView({ lead, onClose }: { lead: SalesLead; onClose: () => void }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: lead.name,
    email: lead.email || "",
    phone: lead.phone || "",
    source: lead.source || "website",
    service_interest: lead.service_interest || "",
    estimated_value: lead.estimated_value || "",
    notes: lead.notes || "",
    status: lead.status,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: typeof editData) => {
      const response = await apiRequest("PATCH", `/api/sales-leads/${lead.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-leads'] });
      toast({ title: "Success", description: "Lead updated successfully" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update lead", variant: "destructive" });
    },
  });

  const convertToClientMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/sales-leads/${lead.id}/convert`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({ title: "Success", description: "Lead converted to client!" });
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to convert lead", variant: "destructive" });
    },
  });

  const currentStage = PIPELINE_STAGES.find(s => s.id === lead.status);
  const StageIcon = currentStage?.icon || Target;

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>Estimated Value</Label>
            <Input
              type="number"
              value={editData.estimated_value}
              onChange={(e) => setEditData({ ...editData, estimated_value: e.target.value })}
            />
          </div>
          <div>
            <Label>Source</Label>
            <Select value={editData.source} onValueChange={(v) => setEditData({ ...editData, source: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Service Interest</Label>
          <Input
            value={editData.service_interest}
            onChange={(e) => setEditData({ ...editData, service_interest: e.target.value })}
          />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={3}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={() => updateLeadMutation.mutate(editData)} disabled={updateLeadMutation.isPending}>
            {updateLeadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <div className={`p-3 rounded-lg ${currentStage?.color || 'bg-gray-500'}`}>
          <StageIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Stage</p>
          <p className="font-semibold text-lg">{currentStage?.label || lead.status}</p>
        </div>
        {lead.estimated_value && parseFloat(lead.estimated_value) > 0 && (
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Deal Value</p>
            <p className="font-bold text-xl text-green-600">${parseFloat(lead.estimated_value).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {lead.email || "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Phone</p>
          <p className="font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {lead.phone || "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Source</p>
          <p className="font-medium">
            {SOURCE_OPTIONS.find(s => s.value === lead.source)?.label || lead.source || "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Service Interest</p>
          <p className="font-medium">{lead.service_interest || "—"}</p>
        </div>
      </div>

      {lead.notes && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Notes</p>
          <p className="text-sm bg-muted/50 p-3 rounded-lg">{lead.notes}</p>
        </div>
      )}

      {lead.created_at && (
        <div className="text-sm text-muted-foreground">
          Created {format(new Date(lead.created_at), "PPP 'at' p")}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          Edit Lead
        </Button>
        {lead.status !== 'won' && lead.status !== 'lost' && (
          <>
            <Button 
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => convertToClientMutation.mutate()}
              disabled={convertToClientMutation.isPending}
            >
              {convertToClientMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Convert to Client
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function CreateLeadForm({ onSuccess, defaultValues }: { onSuccess: () => void; defaultValues?: { source?: string; status?: string; estimated_value?: string } }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: defaultValues?.source || "website",
    service_interest: "",
    estimated_value: defaultValues?.estimated_value || "",
    notes: "",
    status: defaultValues?.status || "new",
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/sales-leads", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-leads'] });
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Name / Company</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter lead name or company"
            data-testid="input-lead-name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
            data-testid="input-lead-email"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(281) 416-4454"
            data-testid="input-lead-phone"
          />
        </div>
        <div>
          <Label htmlFor="source">Lead Source</Label>
          <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
            <SelectTrigger data-testid="select-lead-source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="estimated_value">Estimated Value ($)</Label>
          <Input
            id="estimated_value"
            type="number"
            value={formData.estimated_value}
            onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
            placeholder="0.00"
            data-testid="input-lead-value"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="service_interest">Service Interest</Label>
        <Input
          id="service_interest"
          value={formData.service_interest}
          onChange={(e) => setFormData({ ...formData, service_interest: e.target.value })}
          placeholder="e.g., Panel Upgrade, Emergency Repair"
          data-testid="input-lead-service"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional information about this lead..."
          rows={3}
          data-testid="input-lead-notes"
        />
      </div>
      <Button type="submit" className="w-full" disabled={createLeadMutation.isPending}>
        {createLeadMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create Lead
          </>
        )}
      </Button>
    </form>
  );
}
