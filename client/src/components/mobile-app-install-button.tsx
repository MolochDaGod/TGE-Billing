import { Download, Smartphone, CheckCircle, Chrome, ExternalLink } from "lucide-react";
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

export function MobileAppInstallButton() {
  const { canInstall, isInstalled, isIOS, isAndroid, isSamsung, isMobile, browserName, install } = usePWAInstall();

  if (isInstalled) {
    return null;
  }

  if (!isMobile) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      console.log('[PWA] Installation accepted');
    }
  };

  if (isIOS) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden gap-2 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary"
            data-testid="button-install-app-mobile"
          >
            <Download className="h-4 w-4" />
            <span>Get App</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
              </div>
            </div>
            <DialogTitle className="text-center">Install T.G.E. PROS</DialogTitle>
            <DialogDescription className="text-center">
              Add this app to your iPhone home screen for quick access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div>
                  <p className="font-medium">Tap the Share button</p>
                  <p className="text-sm text-muted-foreground">Look for the square with arrow at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <div>
                  <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                  <p className="text-sm text-muted-foreground">Find it in the list of actions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <div>
                  <p className="font-medium">Tap "Add"</p>
                  <p className="text-sm text-muted-foreground">The app will appear on your home screen</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (canInstall) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstall}
        className="md:hidden gap-2 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary"
        data-testid="button-install-app-mobile"
      >
        <Download className="h-4 w-4" />
        <span>Get App</span>
      </Button>
    );
  }

  if ((isAndroid || isSamsung) && !canInstall) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden gap-2 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary"
            data-testid="button-install-app-mobile"
          >
            <Download className="h-4 w-4" />
            <span>Get App</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
              </div>
            </div>
            <DialogTitle className="text-center">Install T.G.E. PROS</DialogTitle>
            <DialogDescription className="text-center">
              {browserName === 'Samsung Internet' 
                ? 'Install the app from Samsung Internet browser'
                : browserName === 'Chrome'
                ? 'Install the app from Chrome browser'
                : 'Open in Chrome or Samsung Internet to install'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {browserName === 'Samsung Internet' ? (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <p className="font-medium">Tap the menu icon (3 lines)</p>
                    <p className="text-sm text-muted-foreground">Located at the bottom right corner</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <p className="font-medium">Tap "Add page to"</p>
                    <p className="text-sm text-muted-foreground">Or "Install app" if available</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <p className="font-medium">Select "Home screen"</p>
                    <p className="text-sm text-muted-foreground">App icon will be added to your home screen</p>
                  </div>
                </div>
              </div>
            ) : browserName === 'Chrome' ? (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <p className="font-medium">Tap the menu icon (3 dots)</p>
                    <p className="text-sm text-muted-foreground">Located at the top right corner</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                    <p className="text-sm text-muted-foreground">You may need to scroll down in the menu</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <p className="font-medium">Tap "Install"</p>
                    <p className="text-sm text-muted-foreground">The app will be installed on your device</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <Chrome className="h-8 w-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">Open in Chrome</p>
                    <p className="text-sm text-muted-foreground">Best experience for Android</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  For the best installation experience, please open this page in Chrome or Samsung Internet browser.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

export function AppInstallCard() {
  const { canInstall, isInstalled, isIOS, isAndroid, isSamsung, browserName, install } = usePWAInstall();

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      console.log('[PWA] Installation accepted from settings');
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="bg-green-500/20 rounded-full p-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-green-700 dark:text-green-400">App Installed</p>
          <p className="text-sm text-muted-foreground">
            T.G.E. PROS is installed on your device. You can find it on your home screen.
          </p>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors" data-testid="card-install-app">
            <div className="bg-white rounded-xl p-2 shadow">
              <img src={tgeLogo} alt="T.G.E. PROS" className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Install T.G.E. PROS App</p>
              <p className="text-sm text-muted-foreground">
                Add to your iPhone home screen for quick access
              </p>
            </div>
            <Download className="h-5 w-5 text-primary" />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
              </div>
            </div>
            <DialogTitle className="text-center">Install T.G.E. PROS</DialogTitle>
            <DialogDescription className="text-center">
              Add this app to your iPhone home screen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <p className="font-medium">Tap the Share button in Safari</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <p className="font-medium">Tap "Add to Home Screen"</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <p className="font-medium">Tap "Add"</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (canInstall) {
    return (
      <div 
        className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={handleInstall}
        data-testid="card-install-app"
      >
        <div className="bg-white rounded-xl p-2 shadow">
          <img src={tgeLogo} alt="T.G.E. PROS" className="h-10 w-10" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Download Android App</p>
          <p className="text-sm text-muted-foreground">
            Install T.G.E. PROS on your {isSamsung ? 'Samsung' : 'Android'} phone for faster access
          </p>
        </div>
        <Button size="sm" className="gap-2" data-testid="button-install-app-settings">
          <Download className="h-4 w-4" />
          Install
        </Button>
      </div>
    );
  }

  if (isAndroid || isSamsung) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors" data-testid="card-install-app">
            <div className="bg-white rounded-xl p-2 shadow">
              <img src={tgeLogo} alt="T.G.E. PROS" className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Download Android App</p>
              <p className="text-sm text-muted-foreground">
                {browserName === 'Chrome' || browserName === 'Samsung Internet'
                  ? 'Tap to see installation instructions'
                  : 'Open in Chrome to install'}
              </p>
            </div>
            <Download className="h-5 w-5 text-primary" />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-xl p-3 shadow-lg">
                <img src={tgeLogo} alt="T.G.E. PROS" className="h-16 w-16" />
              </div>
            </div>
            <DialogTitle className="text-center">Install T.G.E. PROS</DialogTitle>
            <DialogDescription className="text-center">
              {browserName === 'Samsung Internet' 
                ? 'Install from Samsung Internet'
                : browserName === 'Chrome'
                ? 'Install from Chrome'
                : 'Open in Chrome or Samsung Internet'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {browserName === 'Samsung Internet' ? (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <p className="font-medium">Tap menu (3 lines) at bottom right</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <p className="font-medium">Tap "Add page to" or "Install app"</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <p className="font-medium">Select "Home screen"</p>
                </div>
              </div>
            ) : browserName === 'Chrome' ? (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <p className="font-medium">Tap menu (3 dots) at top right</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <p className="font-medium">Tap "Install"</p>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Chrome className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <p className="font-medium mb-2">Open in Chrome</p>
                <p className="text-sm text-muted-foreground">
                  For the best experience, open this page in Chrome or Samsung Internet browser to install the app.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-muted">
      <div className="bg-muted rounded-full p-2">
        <Smartphone className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-muted-foreground">App Installation</p>
        <p className="text-sm text-muted-foreground">
          Open this page on your Android phone in Chrome to install the app
        </p>
      </div>
    </div>
  );
}
