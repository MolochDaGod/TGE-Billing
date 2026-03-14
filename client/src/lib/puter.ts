/**
 * Puter.js SDK wrapper
 * The SDK is loaded globally via <script src="https://js.puter.com/v2/"></script>
 * This module provides typed access to the global `puter` object.
 */

declare global {
  interface Window {
    puter: PuterSDK;
  }
  const puter: PuterSDK;
}

export interface PuterUser {
  username: string;
  uuid?: string;
  email?: string;
  email_confirmed?: boolean;
}

export interface PuterSDK {
  auth: {
    signIn: () => Promise<void>;
    signOut: () => void;
    isSignedIn: () => boolean;
    getUser: () => Promise<PuterUser>;
  };
  ai: {
    chat: (
      messages: string | Array<{ role: string; content: string }>,
      options?: {
        model?: string;
        stream?: boolean;
        temperature?: number;
        max_tokens?: number;
      }
    ) => Promise<any>;
    txt2img: (prompt: string, options?: any) => Promise<any>;
    img2txt: (imageUrl: string) => Promise<string>;
  };
  kv: {
    set: (key: string, value: string) => Promise<void>;
    get: (key: string) => Promise<string | null>;
    del: (key: string) => Promise<void>;
    list: () => Promise<string[]>;
  };
  fs: {
    write: (path: string, content: string | Blob | Buffer) => Promise<any>;
    read: (path: string) => Promise<Blob>;
    mkdir: (path: string) => Promise<any>;
    readdir: (path: string) => Promise<any[]>;
    delete: (path: string) => Promise<void>;
  };
  print: (...args: any[]) => void;
}

/** Check if Puter SDK is loaded and available */
export function isPuterReady(): boolean {
  return typeof window !== "undefined" && typeof window.puter !== "undefined";
}

/** Get the global puter instance (throws if not loaded) */
export function getPuter(): PuterSDK {
  if (!isPuterReady()) {
    throw new Error("Puter.js SDK not loaded yet");
  }
  return window.puter;
}

/**
 * Wait for Puter SDK to be available (polls every 100ms, timeout after 10s)
 */
export function waitForPuter(timeoutMs = 10000): Promise<PuterSDK> {
  return new Promise((resolve, reject) => {
    if (isPuterReady()) {
      return resolve(window.puter);
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (isPuterReady()) {
        clearInterval(interval);
        resolve(window.puter);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("Puter.js SDK failed to load within timeout"));
      }
    }, 100);
  });
}

/**
 * Send a chat message via Puter AI (free, no API key needed)
 */
export async function puterChat(
  messages: Array<{ role: string; content: string }>,
  options?: { model?: string; stream?: boolean }
): Promise<string> {
  const p = getPuter();
  const response = await p.ai.chat(messages, options);
  // Response can be a string or an object with .message.content
  if (typeof response === "string") return response;
  if (response?.message?.content) return response.message.content;
  if (response?.toString) return response.toString();
  return String(response);
}
