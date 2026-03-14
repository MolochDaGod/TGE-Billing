import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Clock, MapPin, User, Plus, Loader2, CheckCircle, XCircle, Zap, AlertTriangle, Search, Wrench } from "lucide-react";
import { format } from "date-fns";
import type { Booking, Client } from "@shared/schema";

const QUICK_BOOKING_TEMPLATES = [
  {
    id: "service_call",
    name: "Service Call",
    icon: Wrench,
    description: "Standard service visit",
    defaults: { service_type: "Service Call", duration_hours: 2 }
  },
  {
    id: "inspection",
    name: "Inspection",
    icon: Search,
    description: "Electrical inspection",
    defaults: { service_type: "Electrical Inspection", duration_hours: 1 }
  },
  {
    id: "emergency",
    name: "Emergency",
    icon: AlertTriangle,
    description: "Urgent repair needed",
    defaults: { service_type: "Emergency Repair", duration_hours: 3 }
  },
  {
    id: "estimate",
    name: "Free Estimate",
    icon: CalendarIcon,
    description: "On-site quote visit",
    defaults: { service_type: "Free Estimate", duration_hours: 1 }
  },
];

export default function BookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [quickBookingTemplate, setQuickBookingTemplate] = useState<typeof QUICK_BOOKING_TEMPLATES[0] | null>(null);

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      completed: { variant: "outline", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const groupedBookings = {
    upcoming: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending'),
    completed: bookings.filter(b => b.status === 'completed'),
    cancelled: bookings.filter(b => b.status === 'cancelled'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointment Bookings</h1>
          <p className="text-muted-foreground">
            Manage and schedule electrical service appointments
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-booking">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>
                Schedule a new appointment for electrical services
              </DialogDescription>
            </DialogHeader>
            <CreateBookingForm clients={clients} onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Quick Booking</CardTitle>
          </div>
          <CardDescription>Fast-track appointments with pre-configured service types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_BOOKING_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover-elevate"
                onClick={() => setQuickBookingTemplate(template)}
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

      {quickBookingTemplate && (
        <Dialog open={!!quickBookingTemplate} onOpenChange={() => setQuickBookingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <quickBookingTemplate.icon className="h-5 w-5 text-primary" />
                Quick {quickBookingTemplate.name}
              </DialogTitle>
              <DialogDescription>
                {quickBookingTemplate.description} - Select client and schedule
              </DialogDescription>
            </DialogHeader>
            <CreateBookingForm 
              clients={clients} 
              onSuccess={() => setQuickBookingTemplate(null)}
              defaultValues={quickBookingTemplate.defaults}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Appointments ({groupedBookings.upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupedBookings.upcoming.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-4">
                {groupedBookings.upcoming.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`booking-${booking.id}`}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-lg">{booking.service_type}</h3>
                        {getStatusBadge(booking.status)}
                        {booking.created_by_agent && (
                          <Badge variant="outline" className="bg-primary/5">
                            AI Booked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(booking.scheduled_date), "PPP")}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(booking.scheduled_date), "p")} ({booking.duration_minutes} min)
                        </div>
                        {booking.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {booking.location}
                          </div>
                        )}
                      </div>
                      {booking.notes && (
                        <p className="text-sm text-muted-foreground">{booking.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'confirmed' })}
                          data-testid={`button-confirm-${booking.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'completed' })}
                          data-testid={`button-complete-${booking.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'cancelled' })}
                          data-testid={`button-cancel-${booking.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {groupedBookings.completed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed ({groupedBookings.completed.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedBookings.completed.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-3 border rounded" data-testid={`completed-${booking.id}`}>
                    <div>
                      <p className="font-medium">{booking.service_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.scheduled_date), "PPP")}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface CreateBookingFormProps {
  clients: Client[];
  onSuccess: () => void;
  defaultValues?: { service_type?: string; duration_hours?: number };
}

function CreateBookingForm({ clients, onSuccess, defaultValues }: CreateBookingFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    client_id: "",
    service_type: defaultValues?.service_type || "",
    scheduled_date: "",
    duration_minutes: defaultValues?.duration_hours ? String(defaultValues.duration_hours * 60) : "60",
    location: "",
    notes: "",
    assigned_to: user?.id || "",
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/bookings", {
        ...data,
        duration_minutes: parseInt(data.duration_minutes),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBookingMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="client_id">Client</Label>
        <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
          <SelectTrigger data-testid="select-client">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="service_type">Service Type</Label>
        <Input
          id="service_type"
          value={formData.service_type}
          onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
          placeholder="e.g., Panel Upgrade, Outlet Installation"
          required
          data-testid="input-service-type"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduled_date">Date & Time</Label>
          <Input
            id="scheduled_date"
            type="datetime-local"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            required
            data-testid="input-scheduled-date"
          />
        </div>
        <div>
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            required
            data-testid="input-duration"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Service address"
          data-testid="input-location"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional details or special requirements"
          data-testid="textarea-notes"
        />
      </div>
      <Button type="submit" className="w-full" disabled={createBookingMutation.isPending} data-testid="button-submit-booking">
        {createBookingMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Booking"
        )}
      </Button>
    </form>
  );
}
