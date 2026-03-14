import { Mic, MicOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MicrophoneStatusProps {
  isListening: boolean;
  isActivated: boolean;
  error: string | null;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';
  micLevel?: number;
  onToggle: () => void;
  className?: string;
  showLabel?: boolean;
}

export function MicrophoneStatus({
  isListening,
  isActivated,
  error,
  permissionStatus,
  micLevel = 0,
  onToggle,
  className,
  showLabel = false,
}: MicrophoneStatusProps) {
  const hasError = !!error || permissionStatus === 'denied';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActivated ? "default" : isListening ? "secondary" : "ghost"}
          size="icon"
          onClick={onToggle}
          className={cn(
            "relative transition-all duration-200",
            isActivated && "bg-primary text-primary-foreground animate-pulse",
            isListening && !isActivated && "bg-accent",
            hasError && "bg-destructive/10 text-destructive",
            className
          )}
          data-testid="button-microphone-toggle"
        >
          {/* Microphone Icon */}
          {hasError ? (
            <AlertCircle className="h-5 w-5" />
          ) : isListening ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5 opacity-50" />
          )}

          {/* Audio Level Indicator */}
          {isListening && !hasError && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-75"
                style={{ width: `${micLevel * 100}%` }}
              />
            </div>
          )}

          {/* Activated Pulse Ring */}
          {isActivated && !hasError && (
            <div className="absolute inset-0 rounded-md">
              <div className="absolute inset-0 rounded-md bg-primary animate-ping opacity-20" />
            </div>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {hasError ? (
          <p>{error || 'Microphone access denied'}</p>
        ) : isActivated ? (
          <p>🎤 Listening for commands... Say something!</p>
        ) : isListening ? (
          <p>🎧 Listening for wake word "Hey Sparky"</p>
        ) : permissionStatus === 'prompt' ? (
          <p>Click to enable voice activation</p>
        ) : (
          <p>Click to start voice control</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Compact microphone status indicator for dashboard
 */
export function MicrophoneIndicator({
  isListening,
  isActivated,
  className,
}: {
  isListening: boolean;
  isActivated: boolean;
  className?: string;
}) {
  if (!isListening && !isActivated) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
        isActivated 
          ? "bg-primary/20 text-primary border border-primary/30" 
          : "bg-accent/50 text-accent-foreground border border-accent",
        className
      )}
    >
      <Mic className={cn("h-4 w-4", isActivated && "animate-pulse")} />
      <span>
        {isActivated ? "Listening..." : "Wake word active"}
      </span>
    </div>
  );
}
