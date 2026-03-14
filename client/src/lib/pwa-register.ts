export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New version available');
            if (window.confirm('A new version of T.G.E. PROS is available. Reload to update?')) {
              newWorker.postMessage('skipWaiting');
              window.location.reload();
            }
          }
        });
      }
    });

    if (registration.waiting) {
      console.log('[PWA] Service worker waiting');
    }

    if (registration.active) {
      console.log('[PWA] Service worker active');
    }

    await checkForUpdates(registration);

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

async function checkForUpdates(registration: ServiceWorkerRegistration): Promise<void> {
  try {
    await registration.update();
    console.log('[PWA] Checked for updates');
  } catch (error) {
    console.log('[PWA] Update check failed:', error);
  }
}

export function isAppInstalled(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  return document.referrer.includes('android-app://');
}

export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

export function isSamsung(): boolean {
  return /samsung/i.test(navigator.userAgent) || /SM-/i.test(navigator.userAgent);
}

export function isChrome(): boolean {
  return /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
}

export function canInstallPWA(): boolean {
  return (isAndroid() || isSamsung()) && isChrome() && !isAppInstalled();
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[PWA] Persistent storage:', isPersisted ? 'granted' : 'denied');
      return isPersisted;
    } catch (error) {
      console.error('[PWA] Persistent storage request failed:', error);
      return false;
    }
  }
  return false;
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    } catch (error) {
      console.error('[PWA] Storage estimate failed:', error);
      return null;
    }
  }
  return null;
}

export function clearAppCache(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('clearCache');
  }
  
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
  
  localStorage.clear();
  sessionStorage.clear();
}
