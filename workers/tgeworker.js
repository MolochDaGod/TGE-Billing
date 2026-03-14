// ============================================================
// TGEWORKER - T.G.E. Billing AI Worker (Puter Serverless)
// Handles AI chat, lead scoring, content generation, and analytics
// Uses Puter KV for persistent storage and Puter AI for inference
// ============================================================

// ---- Health Check ----
router.get("/health", async () => {
  return {
    status: "ok",
    worker: "tgeworker",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };
});

// ---- AI Chat (Sparky Assistant) ----
// Stores chat history in deployer KV, uses user's AI quota
router.post("/api/chat", async ({ request, user }) => {
  const body = await request.json();
  const { message, sessionId, context, pageName, role } = body;

  if (!message) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build system prompt based on role
  const systemPrompt = getSystemPrompt(role || "client", pageName, context);

  // Load recent chat history from KV for context
  let chatHistory = [];
  if (sessionId) {
    try {
      const saved = await me.puter.kv.get(`tge_chat_${sessionId}`);
      if (saved) {
        chatHistory = JSON.parse(saved);
      }
    } catch (e) {
      // No history, start fresh
    }
  }

  // Build messages array
  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory.slice(-10), // Last 10 messages for context
    { role: "user", content: message },
  ];

  try {
    // Use user's AI quota if authenticated, otherwise deployer's
    const ai = user && user.puter ? user.puter.ai : me.puter.ai;
    const response = await ai.chat(messages, { model: "gpt-4o" });
    const responseText =
      typeof response === "string"
        ? response
        : response?.message?.content || response?.toString() || "";

    // Save to chat history
    if (sessionId) {
      chatHistory.push({ role: "user", content: message });
      chatHistory.push({ role: "assistant", content: responseText });
      // Keep last 50 messages
      if (chatHistory.length > 50) {
        chatHistory = chatHistory.slice(-50);
      }
      await me.puter.kv.set(
        `tge_chat_${sessionId}`,
        JSON.stringify(chatHistory)
      );
    }

    // Log analytics
    await me.puter.kv.incr("tge_analytics_chat_total");
    await me.puter.kv.set(`tge_analytics_chat_${Date.now()}`, JSON.stringify({
      sessionId,
      role,
      pageName,
      timestamp: new Date().toISOString(),
    }));

    return { message: responseText, sessionId };
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "AI chat failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ---- Chat History ----
router.get("/api/chat-history/:sessionId", async ({ params }) => {
  const { sessionId } = params;
  try {
    const saved = await me.puter.kv.get(`tge_chat_${sessionId}`);
    return { sessionId, messages: saved ? JSON.parse(saved) : [] };
  } catch (e) {
    return { sessionId, messages: [] };
  }
});

router.delete("/api/chat-history/:sessionId", async ({ params }) => {
  const { sessionId } = params;
  await me.puter.kv.del(`tge_chat_${sessionId}`);
  return { success: true };
});

// ---- AI Lead Scoring ----
router.post("/api/lead-score", async ({ request, user }) => {
  const body = await request.json();
  const { leadId, leadName, email, phone, source, serviceInterest, notes } = body;

  if (!leadId) {
    return new Response(JSON.stringify({ error: "leadId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = `You are an AI lead scoring assistant for T.G.E. Billing, a Texas electrical services company (License #750779).

Score this sales lead from 0-100 and provide a brief analysis. Consider:
- Service interest value (panel upgrades, commercial = high value)
- Lead source quality
- Completeness of contact info
- Urgency indicators in notes

Lead Data:
- Name: ${leadName || "Unknown"}
- Email: ${email || "Not provided"}
- Phone: ${phone || "Not provided"}
- Source: ${source || "Unknown"}
- Service Interest: ${serviceInterest || "General inquiry"}
- Notes: ${notes || "None"}

Respond in JSON format:
{
  "score": <number 0-100>,
  "tier": "hot" | "warm" | "cold",
  "reasoning": "<brief 1-2 sentence explanation>",
  "suggestedAction": "<recommended next step>",
  "estimatedValue": "<low/medium/high/premium>"
}`;

  try {
    const ai = user && user.puter ? user.puter.ai : me.puter.ai;
    const response = await ai.chat(prompt, { model: "gpt-4o" });
    const responseText =
      typeof response === "string"
        ? response
        : response?.message?.content || response?.toString() || "";

    // Try to parse as JSON
    let scoreData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      scoreData = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 50, tier: "warm", reasoning: responseText };
    } catch {
      scoreData = { score: 50, tier: "warm", reasoning: responseText };
    }

    // Cache the score in KV
    await me.puter.kv.set(
      `tge_leadscore_${leadId}`,
      JSON.stringify({
        ...scoreData,
        leadId,
        scoredAt: new Date().toISOString(),
      })
    );

    await me.puter.kv.incr("tge_analytics_leads_scored");

    return scoreData;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Lead scoring failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ---- Get cached lead score ----
router.get("/api/lead-score/:leadId", async ({ params }) => {
  const { leadId } = params;
  try {
    const saved = await me.puter.kv.get(`tge_leadscore_${leadId}`);
    if (!saved) {
      return new Response(JSON.stringify({ error: "No score found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return JSON.parse(saved);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Failed to retrieve score" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ---- AI Content Generation ----
router.post("/api/content-generate", async ({ request, user }) => {
  const body = await request.json();
  const { type, data } = body;

  const prompts = {
    invoice_description: `Generate a professional invoice line item description for an electrical service job:
Service: ${data?.service || "General electrical work"}
Details: ${data?.details || ""}
Keep it concise (1-2 sentences), professional, and include relevant technical details.`,

    marketing_email: `Write a short, professional marketing email for T.G.E. Billing (Texas Master Electrician, License #750779).
Topic: ${data?.topic || "Seasonal electrical maintenance"}
Target: ${data?.audience || "Residential customers"}
Tone: Friendly, professional, Texas-style. Include a clear call-to-action.
Keep it under 150 words.`,

    sms_message: `Write a brief SMS message (under 160 characters) for T.G.E. Billing:
Purpose: ${data?.purpose || "Appointment reminder"}
Client Name: ${data?.clientName || "Valued Customer"}
Details: ${data?.details || ""}`,

    job_estimate: `Generate a professional job estimate description for an electrical project:
Job Type: ${data?.jobType || "Residential electrical work"}
Scope: ${data?.scope || "Standard service call"}
Location: Texas
Include estimated labor hours range and typical material considerations.
Keep it concise and professional.`,

    social_post: `Write a social media post for T.G.E. Billing, a Texas electrical company:
Platform: ${data?.platform || "Facebook"}
Topic: ${data?.topic || "Electrical safety tips"}
Include relevant hashtags. Keep it engaging and under 200 words.`,
  };

  const prompt = prompts[type];
  if (!prompt) {
    return new Response(
      JSON.stringify({
        error: "Invalid content type",
        validTypes: Object.keys(prompts),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const ai = user && user.puter ? user.puter.ai : me.puter.ai;
    const response = await ai.chat(prompt, { model: "gpt-4o" });
    const content =
      typeof response === "string"
        ? response
        : response?.message?.content || response?.toString() || "";

    await me.puter.kv.incr("tge_analytics_content_generated");

    return { type, content };
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Content generation failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ---- User Preferences (KV-backed) ----
router.post("/api/preferences", async ({ request }) => {
  const body = await request.json();
  const { userId, preferences } = body;

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await me.puter.kv.set(`tge_prefs_${userId}`, JSON.stringify(preferences));
  return { success: true, userId };
});

router.get("/api/preferences/:userId", async ({ params }) => {
  const { userId } = params;
  try {
    const saved = await me.puter.kv.get(`tge_prefs_${userId}`);
    return { userId, preferences: saved ? JSON.parse(saved) : {} };
  } catch (e) {
    return { userId, preferences: {} };
  }
});

// ---- Analytics Dashboard ----
router.get("/api/analytics", async () => {
  try {
    const chatTotal = await me.puter.kv.get("tge_analytics_chat_total");
    const leadsScored = await me.puter.kv.get("tge_analytics_leads_scored");
    const contentGenerated = await me.puter.kv.get("tge_analytics_content_generated");

    return {
      chatMessages: parseInt(chatTotal) || 0,
      leadsScored: parseInt(leadsScored) || 0,
      contentGenerated: parseInt(contentGenerated) || 0,
      timestamp: new Date().toISOString(),
    };
  } catch (e) {
    return { chatMessages: 0, leadsScored: 0, contentGenerated: 0 };
  }
});

// ---- AI Job Recommendation ----
router.post("/api/job-recommend", async ({ request, user }) => {
  const body = await request.json();
  const { clientHistory, location, season } = body;

  const prompt = `You are an AI assistant for T.G.E. Billing (Texas Master Electrician #750779).
Based on this client data, recommend potential upsell services:

Client History: ${clientHistory || "New customer"}
Location: ${location || "Texas"}  
Season: ${season || new Date().toLocaleString("en-US", { month: "long" })}

Suggest 3 relevant electrical services this client might need. For each:
1. Service name
2. Why it's relevant (based on history/season/location)
3. Estimated price range
4. Urgency (low/medium/high)

Respond in JSON format as an array of recommendations.`;

  try {
    const ai = user && user.puter ? user.puter.ai : me.puter.ai;
    const response = await ai.chat(prompt, { model: "gpt-4o" });
    const responseText =
      typeof response === "string"
        ? response
        : response?.message?.content || response?.toString() || "";

    let recommendations;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      recommendations = [{ service: "General Consultation", reason: responseText }];
    }

    return { recommendations };
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Recommendation failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ---- 404 Catch-all ----
router.get("/*page", async ({ params }) => {
  return new Response(
    JSON.stringify({
      error: "Not found",
      worker: "tgeworker",
      path: params.page,
      availableEndpoints: [
        "GET  /health",
        "POST /api/chat",
        "GET  /api/chat-history/:sessionId",
        "DELETE /api/chat-history/:sessionId",
        "POST /api/lead-score",
        "GET  /api/lead-score/:leadId",
        "POST /api/content-generate",
        "POST /api/preferences",
        "GET  /api/preferences/:userId",
        "GET  /api/analytics",
        "POST /api/job-recommend",
      ],
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
});

// ---- Helper: System Prompt Builder ----
function getSystemPrompt(role, pageName, context) {
  const base = `You are Sparky, the AI assistant for T.G.E. Billing (Texas Master Electrician License #750779). You help with electrical business management, invoicing, client relations, and technical electrical questions. Be concise, professional, and Texas-friendly.`;

  const roleAddons = {
    admin: "You're helping a business administrator. Provide business insights, management tips, and full platform guidance.",
    employee: "You're helping a field technician/employee. Focus on job details, safety, and field-relevant info.",
    vendor: "You're helping a vendor partner. Focus on their clients, invoices, and business metrics.",
    client: "You're helping a customer. Be friendly, explain things simply, help with invoices, payments, and scheduling.",
  };

  return `${base}\n\nRole: ${roleAddons[role] || roleAddons.client}\nCurrent page: ${pageName || "Dashboard"}${context ? `\nContext: ${context}` : ""}`;
}
