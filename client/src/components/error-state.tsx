import { AlertCircle, RefreshCw, WifiOff, Lock, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  variant?: 'default' | 'unauthorized' | 'network' | 'server';
}

export function ErrorState({ 
  title, 
  description, 
  error, 
  onRetry, 
  isRetrying = false,
  variant = 'default' 
}: ErrorStateProps) {
  const getVariantConfig = () => {
    switch (variant) {
      case 'unauthorized':
        return {
          icon: Lock,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          defaultTitle: 'Access Denied',
          defaultDescription: 'You don\'t have permission to view this content.',
        };
      case 'network':
        return {
          icon: WifiOff,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          defaultTitle: 'Connection Error',
          defaultDescription: 'Unable to connect. Please check your internet connection.',
        };
      case 'server':
        return {
          icon: ServerCrash,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          defaultTitle: 'Server Error',
          defaultDescription: 'Something went wrong on our end. Please try again later.',
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-destructive',
          bgColor: 'bg-destructive/10',
          defaultTitle: 'Error',
          defaultDescription: 'Something went wrong. Please try again.',
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || error?.message || config.defaultDescription;

  return (
    <Card className="glass-card" data-testid="card-error-state">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div>
            <CardTitle className="text-lg" data-testid="text-error-title">{displayTitle}</CardTitle>
            <CardDescription data-testid="text-error-description">{displayDescription}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {onRetry && (
        <CardContent className="pt-0">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            variant="outline"
            className="gap-2"
            data-testid="button-retry"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  secondaryAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="container-empty-state">
      {Icon && (
        <div className="p-4 rounded-2xl bg-muted/50 mb-4">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-1" data-testid="text-empty-title">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm mb-4" data-testid="text-empty-description">
          {description}
        </p>
      )}
      <div className="flex flex-wrap gap-2 justify-center">
        {action && (
          <Button onClick={action.onClick} className="gap-2" data-testid="button-empty-action">
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button 
            variant="outline" 
            onClick={secondaryAction.onClick}
            data-testid="button-empty-secondary"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
