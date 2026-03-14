import { useState, useCallback, useEffect } from "react";
import { isPuterReady, getPuter, waitForPuter, type PuterUser } from "@/lib/puter";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PuterAuthState {
  puterUser: PuterUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * POST the authenticated Puter user to our backend to create/restore a session.
 * Returns true on success, false on failure (non-throwing).
 */
async function syncPuterSession(user: PuterUser): Promise<boolean> {
  try {
    const res = await apiRequest("POST", "/api/auth/puter", {
      username: user.username,
      email: user.email || `${user.username}@puter.user`,
      name: user.username,
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * React hook for Puter.js authentication.
 * On mount: if user is already signed in to Puter, automatically syncs with the
 * backend session so they don't need to click the button again.
 * signIn(): opens the Puter popup only when NOT already authenticated.
 */
export function usePuterAuth() {
  const [state, setState] = useState<PuterAuthState>({
    puterUser: null,
    isSignedIn: false,
    isLoading: true,
    error: null,
  });

  // On mount: check Puter auth state; if already signed in, auto-create backend session
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const p = await waitForPuter();
        if (cancelled) return;

        if (p.auth.isSignedIn()) {
          const user = await p.auth.getUser();
          if (cancelled) return;
          // Silently create/restore the backend session
          await syncPuterSession(user);
          if (cancelled) return;
          setState({
            puterUser: user,
            isSignedIn: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, isLoading: false, error: "Puter SDK not available" }));
        }
      }
    }

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  /**
   * Sign in with Puter.
   * If the user is already authenticated with Puter (e.g. returned from a previous
   * session), skips the popup and just syncs with the backend.
   * Otherwise opens the Puter sign-in popup (must be called from a user action).
   */
  const signIn = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const p = getPuter();

      // Only open the Puter popup if not already signed in
      if (!p.auth.isSignedIn()) {
        await p.auth.signIn(); // Opens popup; resolves when user authenticates
      }

      const user = await p.auth.getUser();

      // Create/restore backend session
      await syncPuterSession(user);

      setState({
        puterUser: user,
        isSignedIn: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err.message || "Sign in failed",
      }));
      throw err; // Re-throw so the auth page can show an error toast
    }
  }, []);

  /**
   * Sign out from both Puter and the backend session.
   */
  const signOut = useCallback(async () => {
    try {
      if (isPuterReady()) {
        getPuter().auth.signOut();
      }
      await fetch("/api/logout", { credentials: "include" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setState({
        puterUser: null,
        isSignedIn: false,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s,
        error: err.message || "Sign out failed",
      }));
    }
  }, []);

  return {
    ...state,
    signIn,
    signOut,
  };
}
