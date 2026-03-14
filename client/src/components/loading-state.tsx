import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { VideoLoader } from "@/components/video-loader";

interface LoadingStateProps {
  variant?: 'page' | 'card' | 'table' | 'inline' | 'fullscreen';
  rows?: number;
  message?: string;
}

export function LoadingState({ variant = 'page', rows = 3, message }: LoadingStateProps) {
  switch (variant) {
    case 'fullscreen':
      return (
        <div className="flex h-screen items-center justify-center" data-testid="loading-fullscreen">
          <VideoLoader size="lg" message={message || 'Loading...'} />
        </div>
      );

    case 'inline':
      return (
        <div className="flex items-center gap-2 text-muted-foreground" data-testid="loading-inline">
          <VideoLoader size="sm" />
          <span className="text-sm">{message || 'Loading...'}</span>
        </div>
      );

    case 'card':
      return (
        <Card className="glass-card" data-testid="loading-card">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );

    case 'table':
      return (
        <div className="space-y-4" data-testid="loading-table">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="rounded-lg border">
            <div className="border-b p-4">
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
            </div>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="border-b p-4 last:border-b-0">
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'page':
    default:
      return (
        <div className="space-y-6" data-testid="loading-page">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Card className="glass-card">
            <CardHeader>
              <Skeleton className="h-5 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      );
  }
}

export function StatCardSkeleton() {
  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" data-testid="loading-dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <LoadingState variant="card" rows={4} />
        <LoadingState variant="card" rows={4} />
      </div>
    </div>
  );
}
