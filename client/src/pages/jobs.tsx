import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Job, Client, User } from "@shared/schema";
import { insertJobSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye, 
  MapPin, 
  User as UserIcon, 
  Briefcase,
  Zap,
  Home,
  Car,
  Lightbulb,
  Wrench,
  Building2,
  Gauge,
  Plug,
  Battery,
  Cpu
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type JobWithRelations = Job & { client?: Client; assignedUser?: User };

const jobFormSchema = insertJobSchema.extend({
  client_id: z.string().min(1, "Client is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  scheduled_date: z.date().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface QuickJobTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  defaultDescription: string;
  category: string;
  estimatedHours: string;
  color: string;
}

const quickJobTemplates: QuickJobTemplate[] = [
  {
    id: "panel_upgrade",
    name: "Panel Upgrade",
    icon: <Gauge className="h-5 w-5" />,
    description: "100/200/400 amp service upgrade",
    defaultDescription: "Electrical panel upgrade including:\n- Remove existing panel\n- Install new main breaker panel\n- Transfer circuits to new panel\n- Update grounding and bonding\n- Final inspection coordination",
    category: "residential",
    estimatedHours: "6-10 hours",
    color: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
  },
  {
    id: "ev_charger",
    name: "EV Charger Install",
    icon: <Car className="h-5 w-5" />,
    description: "Level 2 charger installation",
    defaultDescription: "Electric vehicle charger installation:\n- Site assessment and circuit planning\n- Run dedicated circuit from panel\n- Install NEMA 14-50 outlet or hardwired charger\n- Test and verify charging operation\n- Provide user documentation",
    category: "residential",
    estimatedHours: "3-5 hours",
    color: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
  },
  {
    id: "bathroom_remodel",
    name: "Bathroom Remodel",
    icon: <Home className="h-5 w-5" />,
    description: "Complete bathroom electrical",
    defaultDescription: "Bathroom electrical remodel:\n- GFCI outlet installation\n- Exhaust fan with humidity sensor\n- Vanity light fixtures\n- Recessed LED lighting\n- Heated floor thermostat (if applicable)\n- Code compliance verification",
    category: "residential",
    estimatedHours: "4-8 hours",
    color: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
  },
  {
    id: "kitchen_remodel",
    name: "Kitchen Remodel",
    icon: <Plug className="h-5 w-5" />,
    description: "Kitchen circuits and lighting",
    defaultDescription: "Kitchen electrical remodel:\n- Dedicated circuits for appliances\n- Under-cabinet LED lighting\n- Pendant/island lighting\n- GFCI outlets per code\n- Range/oven circuit\n- Dishwasher and disposal circuits",
    category: "residential",
    estimatedHours: "6-12 hours",
    color: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
  },
  {
    id: "whole_house_rewire",
    name: "Whole House Rewire",
    icon: <Zap className="h-5 w-5" />,
    description: "Complete home electrical update",
    defaultDescription: "Complete electrical system upgrade:\n- Replace all existing wiring\n- New panel and circuits\n- Update all outlets and switches\n- Install smoke/CO detectors\n- Whole house surge protection\n- Full NEC 2023 compliance",
    category: "residential",
    estimatedHours: "40-80 hours",
    color: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
  },
  {
    id: "generator_install",
    name: "Generator Install",
    icon: <Battery className="h-5 w-5" />,
    description: "Standby generator setup",
    defaultDescription: "Standby generator installation:\n- Transfer switch installation\n- Gas line coordination (with plumber)\n- Generator pad preparation\n- Electrical connections\n- Load testing and programming\n- Customer training on operation",
    category: "residential",
    estimatedHours: "8-12 hours",
    color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
  },
  {
    id: "smart_home",
    name: "Smart Home Wiring",
    icon: <Cpu className="h-5 w-5" />,
    description: "Smart switches and automation",
    defaultDescription: "Smart home electrical setup:\n- Smart switch/dimmer installation\n- WiFi thermostat wiring\n- Smart doorbell installation\n- Whole home audio wiring\n- Network/low voltage runs\n- Hub and controller setup",
    category: "residential",
    estimatedHours: "4-16 hours",
    color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400"
  },
  {
    id: "commercial_service",
    name: "Commercial Service",
    icon: <Building2 className="h-5 w-5" />,
    description: "Commercial electrical work",
    defaultDescription: "Commercial electrical service:\n- Troubleshooting and repairs\n- Lighting upgrades (LED retrofit)\n- Circuit additions\n- Equipment connections\n- Emergency service\n- Code compliance review",
    category: "commercial",
    estimatedHours: "Varies",
    color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
  },
  {
    id: "lighting_install",
    name: "Light Fixture Install",
    icon: <Lightbulb className="h-5 w-5" />,
    description: "Fixture replacement or new",
    defaultDescription: "Light fixture installation:\n- Remove existing fixture\n- Install new fixture/fan\n- Verify proper support\n- Test operation\n- Cleanup and disposal",
    category: "residential",
    estimatedHours: "1-2 hours per fixture",
    color: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
  },
  {
    id: "service_call",
    name: "Service Call",
    icon: <Wrench className="h-5 w-5" />,
    description: "Troubleshooting & repairs",
    defaultDescription: "Electrical service call:\n- Diagnose electrical issue\n- Provide repair estimate\n- Complete authorized repairs\n- Test and verify\n- Document work completed",
    category: "service",
    estimatedHours: "1-3 hours",
    color: "bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400"
  }
];

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "scheduled":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "scheduled":
      return "Scheduled";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export default function Jobs() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWithRelations | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<QuickJobTemplate | null>(null);

  const { data: jobs, isLoading: isJobsLoading, error: jobsError } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    retry: false,
  });

  const { data: clients, isLoading: isClientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: employees, isLoading: isEmployeesLoading } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "employee" }],
    queryFn: async () => {
      const res = await fetch("/api/users?role=employee", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
    retry: false,
    enabled: user?.role === "admin" || user?.role === "pirate_king" || user?.role === "staff_captain" || user?.role === "staff",
  });

  const clientsMap = useMemo(() => {
    if (!clients) return new Map();
    return new Map(clients.map(c => [c.id, c]));
  }, [clients]);

  const employeesMap = useMemo(() => {
    if (!employees) return new Map();
    return new Map(employees.map(e => [e.id, e]));
  }, [employees]);

  const jobsWithRelations = useMemo(() => {
    if (!jobs) return [];
    return jobs.map(job => ({
      ...job,
      client: clientsMap.get(job.client_id),
      assignedUser: job.assigned_to ? employeesMap.get(job.assigned_to) : undefined,
    }));
  }, [jobs, clientsMap, employeesMap]);

  const filteredJobs = useMemo(() => {
    let filtered = jobsWithRelations;

    if (statusFilter !== "all") {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query) ||
          job.client?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [jobsWithRelations, statusFilter, searchQuery]);

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      const jobData = {
        client_id: data.client_id,
        assigned_to: data.assigned_to || null,
        title: data.title,
        description: data.description || "",
        status: data.status,
        scheduled_date: data.scheduled_date || null,
        location: data.location || "",
        notes: data.notes || "",
      };

      const res = await apiRequest("POST", "/api/jobs", jobData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setCreateDialogOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Success",
        description: "Job created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to create jobs",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: JobFormValues }) => {
      const jobData = {
        client_id: data.client_id,
        assigned_to: data.assigned_to || null,
        title: data.title,
        description: data.description || "",
        status: data.status,
        scheduled_date: data.scheduled_date || null,
        location: data.location || "",
        notes: data.notes || "",
      };

      const res = await apiRequest("PATCH", `/api/jobs/${id}`, jobData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setEditDialogOpen(false);
      setSelectedJob(null);
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to update jobs",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/jobs/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to delete jobs",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const handleViewJob = (job: JobWithRelations) => {
    setSelectedJob(job);
    setViewDialogOpen(true);
  };

  const handleEditJob = (job: JobWithRelations) => {
    setSelectedJob(job);
    setEditDialogOpen(true);
  };

  const handleDeleteJob = (id: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      deleteJobMutation.mutate(id);
    }
  };

  const handleQuickJobClick = (template: QuickJobTemplate) => {
    setSelectedTemplate(template);
    setCreateDialogOpen(true);
  };

  if (isAuthLoading || isJobsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (jobsError && isUnauthorizedError(jobsError as Error)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>You don't have permission to view jobs.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const canManageJobs = user?.role === "admin" || user?.role === "pirate_king" || user?.role === "staff_captain" || user?.role === "staff";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-jobs-title">Jobs</h1>
          <p className="text-muted-foreground">Manage your jobs and service appointments</p>
        </div>
        {canManageJobs && (
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setSelectedTemplate(null);
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-job">
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTemplate ? `New ${selectedTemplate.name} Job` : "Create New Job"}
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate 
                    ? `Create a ${selectedTemplate.name.toLowerCase()} job with pre-filled details`
                    : "Schedule a new job for a client"
                  }
                </DialogDescription>
              </DialogHeader>
              <JobForm
                clients={clients || []}
                employees={employees || []}
                onSubmit={(data) => createJobMutation.mutate(data)}
                isSubmitting={createJobMutation.isPending}
                template={selectedTemplate}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {canManageJobs && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Job Templates
            </CardTitle>
            <CardDescription>
              Click a template to quickly create a common job type with pre-filled details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {quickJobTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleQuickJobClick(template)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover-elevate",
                    template.color
                  )}
                  data-testid={`button-quick-job-${template.id}`}
                >
                  <div className="p-2 rounded-full bg-background/80">
                    {template.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, location, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64"
                data-testid="input-search-jobs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                        <p>No jobs found</p>
                        {canManageJobs && (
                          <p className="text-sm">Use a quick template above or click "Create Job" to get started</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => handleViewJob(job)}
                      data-testid={`row-job-${job.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-job-title-${job.id}`}>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          {job.title}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-job-client-${job.id}`}>
                        {job.client?.name || "—"}
                      </TableCell>
                      <TableCell data-testid={`text-job-assigned-${job.id}`}>
                        {job.assignedUser ? (
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                            {job.assignedUser.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-job-status-${job.id}`}>
                        <Badge variant={getStatusColor(job.status)}>
                          {getStatusLabel(job.status)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-job-date-${job.id}`}>
                        {job.scheduled_date ? (
                          format(new Date(job.scheduled_date), "MMM dd, yyyy")
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-job-location-${job.id}`}>
                        {job.location ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[150px]">{job.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleViewJob(job)}
                            data-testid={`button-view-${job.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageJobs && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditJob(job)}
                                data-testid={`button-edit-${job.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {(user?.role === "admin" || user?.role === "pirate_king") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteJob(job.id)}
                                  data-testid={`button-delete-${job.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedJob && (
        <>
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Job Details</DialogTitle>
                <DialogDescription>View job information</DialogDescription>
              </DialogHeader>
              <JobDetailView job={selectedJob} />
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Job</DialogTitle>
                <DialogDescription>Update job information</DialogDescription>
              </DialogHeader>
              <JobForm
                job={selectedJob}
                clients={clients || []}
                employees={employees || []}
                onSubmit={(data) => updateJobMutation.mutate({ id: selectedJob.id, data })}
                isSubmitting={updateJobMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function JobForm({
  job,
  clients,
  employees,
  onSubmit,
  isSubmitting,
  template,
}: {
  job?: JobWithRelations;
  clients: Client[];
  employees: User[];
  onSubmit: (data: JobFormValues) => void;
  isSubmitting: boolean;
  template?: QuickJobTemplate | null;
}) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      client_id: job?.client_id || "",
      assigned_to: job?.assigned_to || "",
      title: job?.title || (template?.name || ""),
      description: job?.description || (template?.defaultDescription || ""),
      status: (job?.status as "scheduled" | "in_progress" | "completed" | "cancelled") || "scheduled",
      scheduled_date: job?.scheduled_date ? new Date(job.scheduled_date) : undefined,
      location: job?.location || "",
      notes: job?.notes || (template ? `Estimated hours: ${template.estimatedHours}\nCategory: ${template.category}` : ""),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {template && (
          <div className={cn("p-3 rounded-lg border flex items-center gap-3", template.color)}>
            <div className="p-2 rounded-full bg-background/80">
              {template.icon}
            </div>
            <div>
              <p className="font-medium">{template.name}</p>
              <p className="text-sm text-muted-foreground">{template.estimatedHours}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-job-client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "__unassigned__" ? "" : value)} 
                  defaultValue={field.value || "__unassigned__"}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-job-assigned">
                      <SelectValue placeholder="Select an employee (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Panel Upgrade - 200A" data-testid="input-job-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope of Work</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Detailed description of the work to be performed..."
                  rows={5}
                  data-testid="input-job-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-job-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduled_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        data-testid="button-schedule-date"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Location / Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123 Main St, Houston, TX 77001" data-testid="input-job-location" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Any additional notes for the team..."
                  rows={3}
                  data-testid="input-job-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} data-testid="button-submit-job">
            {isSubmitting ? "Saving..." : (job ? "Update Job" : "Create Job")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function JobDetailView({ job }: { job: JobWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Job Title</p>
          <p className="font-medium">{job.title}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge variant={getStatusColor(job.status)}>
            {getStatusLabel(job.status)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="font-medium">{job.client?.name || "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Assigned To</p>
          <p className="font-medium">{job.assignedUser?.name || "Unassigned"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Scheduled Date</p>
          <p className="font-medium">
            {job.scheduled_date
              ? format(new Date(job.scheduled_date), "PPP")
              : "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Location</p>
          <p className="font-medium">{job.location || "—"}</p>
        </div>
      </div>

      {job.description && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Scope of Work</p>
          <div className="bg-muted/50 rounded-lg p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{job.description}</pre>
          </div>
        </div>
      )}

      {job.notes && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Internal Notes</p>
          <div className="bg-muted/50 rounded-lg p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans">{job.notes}</pre>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
        <p>Created: {format(new Date(job.created_at), "PPP 'at' p")}</p>
        <p>Updated: {format(new Date(job.updated_at), "PPP 'at' p")}</p>
      </div>
    </div>
  );
}
