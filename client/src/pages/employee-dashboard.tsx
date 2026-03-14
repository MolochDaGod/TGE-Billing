import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Users,
  MapPin,
  Calendar,
  Phone
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function EmployeeDashboard() {
  const { data: myJobs = [] } = useQuery({
    queryKey: ['/api/jobs/my-jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/my-jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const { data: todaySchedule = [] } = useQuery({
    queryKey: ['/api/jobs/today'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/today');
      if (!response.ok) throw new Error('Failed to fetch schedule');
      return response.json();
    },
  });

  const activeJobs = myJobs.filter((job: any) => job.status === 'in_progress');
  const scheduledJobs = myJobs.filter((job: any) => job.status === 'scheduled');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-employee-dashboard-title">My Dashboard</h1>
        <p className="text-muted-foreground">Today's schedule and active jobs</p>
      </div>

      {/* Job Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-active-jobs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card data-testid="card-scheduled-jobs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledJobs.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming appointments</p>
          </CardContent>
        </Card>

        <Card data-testid="card-today-schedule">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaySchedule.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No jobs scheduled for today</p>
            </div>
          ) : (
            todaySchedule.map((job: any) => (
              <Card key={job.id} className="hover-elevate cursor-pointer" data-testid={`job-${job.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{job.title}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {job.client_name}
                        </div>
                        {job.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </div>
                        )}
                        {job.client_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {job.client_phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {job.scheduled_date && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {format(new Date(job.scheduled_date), 'h:mm a')}
                        </p>
                      )}
                      <Badge variant={job.status === 'in_progress' ? 'default' : 'secondary'} className="capitalize">
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Active Jobs</CardTitle>
            <CardDescription>Jobs currently in progress</CardDescription>
          </div>
          <Link href="/jobs">
            <Button variant="outline" size="sm" data-testid="button-view-all-jobs">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active jobs</p>
          ) : (
            activeJobs.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.client_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <Badge variant="outline" className="text-xs">In Progress</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Link href="/jobs">
            <Button variant="outline" className="w-full justify-start" data-testid="button-view-jobs">
              <Briefcase className="mr-2 h-4 w-4" />
              View All Jobs
            </Button>
          </Link>
          <Link href="/clients">
            <Button variant="outline" className="w-full justify-start" data-testid="button-client-lookup">
              <Users className="mr-2 h-4 w-4" />
              Client Lookup
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
