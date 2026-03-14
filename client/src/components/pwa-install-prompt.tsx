import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import tgeLogo from "@assets/tgelogo_1763888346781.webp";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user hasn't dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        // Show prompt after a short delay
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferredPrompt for next time
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] w-[calc(100%-2rem)] max-w-md"
        data-testid="prompt-pwa-install"
      >
        <div className="bg-gradient-to-br from-primary/95 to-accent/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-primary/20 p-6">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
            data-testid="button-dismiss-pwa"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="flex gap-4 items-start mb-4">
            <div className="flex-shrink-0">
              <div className="bg-white rounded-xl p-2 shadow-lg">
                <img 
                  src={tgeLogo} 
                  alt="ElectraPro Logo" 
                  className="h-12 w-12"
                />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">
                Install ElectraPro App
              </h3>
              <p className="text-white/90 text-sm">
                Get faster access and work offline! Install our app on your phone for the best experience.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Smartphone className="h-4 w-4" />
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Smartphone className="h-4 w-4" />
              <span>Faster loading</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Smartphone className="h-4 w-4" />
              <span>Home screen access</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold"
              data-testid="button-install-pwa"
            >
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              data-testid="button-dismiss-pwa-later"
            >
              Later
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
