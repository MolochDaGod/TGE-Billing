import { Download, Smartphone, CheckCircle, Chrome, Share, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import tgeLogo from "@assets/tgelogo_1763888346781.webp";

interface DownloadAppButtonProps {
  variant?: "default" | "outline" | "ghost" | "landing";
  size?: "default" | "sm" | "lg";
  showOnDesktop?: boolean;
  className?: string;
}

export function DownloadAppButton({ 
  variant = "default", 
  size = "default",
  showOnDesktop = true,
  className = ""
}: DownloadAppButtonProps) {
  const { canInstall, isInstalled, isIOS, isAndroid, isSamsung, isMobile, browserName, install } = usePWAInstall();

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      console.log('[PWA] Installation accepted');
    }
  };

  if (isInstalled) {
    return (
      <Button 
        variant="outline" 
        size={size}
        disabled
        className={`gap-2 ${className}`}
        data-testid="button-app-installed"
      >
        <CheckCircle className="h-4 w-4 text-green-500" />
        App Installed
      </Button>
    );
  }

  if (!isMobile && !showOnDesktop) {
    return null;
  }

  const buttonClassName = variant === "landing" 
    ? `gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary font-semibold ${className}`
    : `gap-2 ${className}`;

  if (isIOS) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={variant === "landing" ? "outline" : variant}
            size={size}
            className={buttonClassName}
            data-testid="button-download-app"
          >
            <Download className="h-4 w-4" />
            Download App
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">Install T.G.E. PROS</DialogTitle>
            <DialogDescription className="text-center">
              Add to your iPhone home screen for instant access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 space-y-4 border border-primary/10">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div>
                  <p className="font-medium">Tap the Share button</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Share className="h-4 w-4" /> at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <div>
                  <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Plus className="h-4 w-4" /> Find it in the actions list
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <div>
                  <p className="font-medium">Tap "Add" in the top right</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The app icon will appear on your home screen
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <Smartphone className="h-3 w-3" />
              <span>Works offline with push notifications</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (canInstall) {
    return (
      <Button
        variant={variant === "landing" ? "outline" : variant}
        size={size}
        onClick={handleInstall}
        className={buttonClassName}
        data-testid="button-download-app"
      >
        <Download className="h-4 w-4" />
        Download App
      </Button>
    );
  }

  if (isAndroid || isSamsung) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={variant === "landing" ? "outline" : variant}
            size={size}
            className={buttonClassName}
            data-testid="button-download-app"
          >
            <Download className="h-4 w-4" />
            Download App
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">Install T.G.E. PROS</DialogTitle>
            <DialogDescription className="text-center">
              {browserName === 'Samsung Internet' 
                ? 'Install from Samsung Internet'
                : browserName === 'Chrome'
                ? 'Install from Chrome'
                : 'Open in Chrome for best experience'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {browserName === 'Samsung Internet' ? (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 space-y-4 border border-primary/10">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <p className="font-medium">Tap menu (3 lines)</p>
                    <p className="text-sm text-muted-foreground mt-1">Bottom right corner</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <p className="font-medium">Tap "Add page to" or "Install app"</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <p className="font-medium">Select "Home screen"</p>
                  </div>
                </div>
              </div>
            ) : browserName === 'Chrome' ? (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 space-y-4 border border-primary/10">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <p className="font-medium">Tap menu (3 dots)</p>
                    <p className="text-sm text-muted-foreground mt-1">Top right corner</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <p className="font-medium">Tap "Install app"</p>
                    <p className="text-sm text-muted-foreground mt-1">or "Add to Home screen"</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <p className="font-medium">Tap "Install"</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-xl p-6 text-center space-y-4">
                <Chrome className="h-14 w-14 text-blue-500 mx-auto" />
                <div>
                  <p className="font-medium text-lg mb-1">Open in Chrome</p>
                  <p className="text-sm text-muted-foreground">
                    For the best installation experience, open this page in Chrome or Samsung Internet browser.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <Smartphone className="h-3 w-3" />
              <span>Works offline with push notifications</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isMobile && showOnDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={variant === "landing" ? "outline" : variant}
            size={size}
            className={buttonClassName}
            data-testid="button-download-app"
          >
            <Download className="h-4 w-4" />
            Download App
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">Get T.G.E. PROS on Mobile</DialogTitle>
            <DialogDescription className="text-center">
              Scan this page on your phone to install the app
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-muted/50 rounded-xl p-6 text-center space-y-4">
              <Smartphone className="h-14 w-14 text-primary mx-auto" />
              <div>
                <p className="font-medium text-lg mb-2">Open on Your Phone</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Visit this website on your Android or iPhone to download the mobile app.
                </p>
                <div className="bg-background rounded-lg p-3 border text-xs font-mono break-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://tgepros.replit.app'}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Push notifications</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Fast & native feel</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
