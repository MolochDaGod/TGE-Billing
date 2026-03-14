import { useState, useCallback, useEffect } from "react";
import { isPuterReady, getPuter, waitForPuter, type PuterUser } from "@/lib/puter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface PuterAuthState {
  puterUser: PuterUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * React hook for Puter.js authentication.
 * Handles Puter sign-in and links the Puter account to a server-side session.
 */
export function usePuterAuth() {
  const [state, setState] = useState<PuterAuthState>({
    puterUser: null,
    isSignedIn: false,
    isLoading: true,
    error: null,
  });

  // Check initial auth state once Puter SDK is ready
  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const p = await waitForPuter();
        if (cancelled) return;

        if (p.auth.isSignedIn()) {
          const user = await p.auth.getUser();
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
   * Sign in with Puter (opens popup), then link with the backend session.
   */
  const signIn = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const p = getPuter();
      await p.auth.signIn();
      const user = await p.auth.getUser();

      // Link Puter user to backend session
      const res = await apiRequest("POST", "/api/auth/puter", {
        username: user.username,
        email: user.email || `${user.username}@puter.user`,
        name: user.username,
      });

      if (res.ok) {
        // Invalidate the auth query so useAuth() picks up the server user
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }

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
