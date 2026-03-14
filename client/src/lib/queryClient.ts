import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          errorMessage = json.message || json.error || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // Use statusText as fallback
    }

    // Handle 401 specifically
    if (res.status === 401) {
      // Redirect to auth page on unauthorized
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.href = '/auth';
      }
      throw new Error(`401: Session expired. Please log in again.`);
    }

    // Handle 403 specifically  
    if (res.status === 403) {
      throw new Error(`403: You don't have permission to perform this action.`);
    }

    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retryCount: number = 0
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Check if it's a network error
    const isNetworkError = error instanceof TypeError || 
                          (error instanceof Error && error.message.includes('Failed to fetch'));
    
    // Retry on network errors (but not on 401/403/400)
    if (retryCount < 3 && isNetworkError) {
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return apiRequest(method, url, data, retryCount + 1);
    }
    
    // Provide user-friendly error message for network issues
    if (isNetworkError) {
      throw new Error('Unable to connect to server. Please check your internet connection and try again.');
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Don't retry on auth errors or client errors (4xx)
        const errorMessage = error?.toString() || '';
        if (errorMessage.includes('401') || 
            errorMessage.includes('403') || 
            errorMessage.includes('400') ||
            errorMessage.includes('404')) {
          return false;
        }
        // Retry network errors and server errors (5xx) up to 3 times
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Retry network errors for mutations once
        const errorMessage = error?.toString() || '';
        const isNetworkError = errorMessage.includes('Failed to fetch') || 
                              errorMessage.includes('network');
        return isNetworkError && failureCount < 1;
      },
    },
  },
});
