import logoVideo from "@assets/logovideo_1764919096833.mp4";

interface VideoLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-32 w-32",
  xl: "h-48 w-48",
};

export function VideoLoader({ size = "md", message, className = "" }: VideoLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} data-testid="video-loader">
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden`}>
        <video
          src={logoVideo}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          data-testid="video-loader-video"
        />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse" data-testid="video-loader-message">
          {message}
        </p>
      )}
    </div>
  );
}

export function AIThinkingLoader({ message = "Sparky is thinking..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 p-4" data-testid="ai-thinking-loader">
      <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
        <video
          src={logoVideo}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Sparky</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">{message}</span>
          <span className="flex gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-screen items-center justify-center" data-testid="full-page-loader">
      <VideoLoader size="lg" message={message} />
    </div>
  );
}
