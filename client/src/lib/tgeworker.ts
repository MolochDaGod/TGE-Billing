/**
 * TGEWORKER Client Library
 * Calls the TGE-Billing Puter Serverless Worker for AI-powered features.
 *
 * The worker URL is set after deployment. During development, falls back
 * to direct Puter.js SDK calls or the Express backend.
 */

// Set this after deploying the worker (e.g. "https://tgeworker-xxxxx.puter.site")
const TGEWORKER_URL =
  (typeof window !== "undefined" && (window as any).__TGEWORKER_URL) ||
  import.meta.env.VITE_TGEWORKER_URL ||
  "";

async function workerFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!TGEWORKER_URL) {
    throw new Error("TGEWORKER_URL not configured");
  }
  const url = `${TGEWORKER_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

// ---- AI Chat ----
export async function workerChat(
  message: string,
  opts: { sessionId?: string; context?: string; pageName?: string; role?: string } = {}
): Promise<{ message: string; sessionId?: string }> {
  const res = await workerFetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      sessionId: opts.sessionId,
      context: opts.context,
      pageName: opts.pageName,
      role: opts.role,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Chat failed");
  }
  return res.json();
}

// ---- Chat History ----
export async function getChatHistory(
  sessionId: string
): Promise<{ sessionId: string; messages: Array<{ role: string; content: string }> }> {
  const res = await workerFetch(`/api/chat-history/${sessionId}`);
  return res.json();
}

export async function clearChatHistory(sessionId: string): Promise<void> {
  await workerFetch(`/api/chat-history/${sessionId}`, { method: "DELETE" });
}

// ---- Lead Scoring ----
export interface LeadScoreInput {
  leadId: string;
  leadName?: string;
  email?: string;
  phone?: string;
  source?: string;
  serviceInterest?: string;
  notes?: string;
}

export interface LeadScoreResult {
  score: number;
  tier: "hot" | "warm" | "cold";
  reasoning: string;
  suggestedAction: string;
  estimatedValue: string;
}

export async function scoreLeadAI(data: LeadScoreInput): Promise<LeadScoreResult> {
  const res = await workerFetch("/api/lead-score", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Lead scoring failed");
  }
  return res.json();
}

export async function getCachedLeadScore(leadId: string): Promise<LeadScoreResult | null> {
  const res = await workerFetch(`/api/lead-score/${leadId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to retrieve lead score");
  return res.json();
}

// ---- Content Generation ----
export type ContentType =
  | "invoice_description"
  | "marketing_email"
  | "sms_message"
  | "job_estimate"
  | "social_post";

export async function generateContent(
  type: ContentType,
  data: Record<string, string> = {}
): Promise<{ type: string; content: string }> {
  const res = await workerFetch("/api/content-generate", {
    method: "POST",
    body: JSON.stringify({ type, data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Content generation failed");
  }
  return res.json();
}

// ---- Preferences ----
export async function savePreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<void> {
  await workerFetch("/api/preferences", {
    method: "POST",
    body: JSON.stringify({ userId, preferences }),
  });
}

export async function loadPreferences(
  userId: string
): Promise<Record<string, unknown>> {
  const res = await workerFetch(`/api/preferences/${userId}`);
  const data = await res.json();
  return data.preferences || {};
}

// ---- Analytics ----
export interface WorkerAnalytics {
  chatMessages: number;
  leadsScored: number;
  contentGenerated: number;
  timestamp: string;
}

export async function getWorkerAnalytics(): Promise<WorkerAnalytics> {
  const res = await workerFetch("/api/analytics");
  return res.json();
}

// ---- Job Recommendations ----
export async function getJobRecommendations(
  data: { clientHistory?: string; location?: string; season?: string } = {}
): Promise<{ recommendations: Array<Record<string, unknown>> }> {
  const res = await workerFetch("/api/job-recommend", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Recommendation failed");
  }
  return res.json();
}

// ---- Health Check ----
export async function checkWorkerHealth(): Promise<boolean> {
  try {
    const res = await workerFetch("/health");
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

/** Returns true if TGEWORKER URL is configured */
export function isWorkerConfigured(): boolean {
  return !!TGEWORKER_URL;
}
