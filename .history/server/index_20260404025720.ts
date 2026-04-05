/**
 * server/index.ts
 * Local development entry point.
 * Adds Vite dev server / static serving / WebSocket / listen on top of the
 * pure Express app defined in server/app.ts.
 * Vercel serverless uses api/index.ts → server/app.ts directly.
 */
import { createServer } from "http";
import { app, initApp } from "./app";
import { setupVite, serveStatic, log } from "./vite";
import { setupRealtimeAI } from "./realtimeAI";
import { seedAIAgents } from "./services/ai-agents-seed";
import { seedDefaultAutomations } from "./services/ai-automation";
import { seedWorkflowTemplates } from "./services/ai-workflow-templates";
import { seedSykesPortal } from "./services/sykes-seed";

export { app, initApp };

(async () => {
  await initApp();

  const server = createServer(app);

  // Realtime AI voice WebSocket
  setupRealtimeAI(server);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, async () => {
    log(`serving on port ${port}`);
    try {
      await seedAIAgents();
      await seedDefaultAutomations();
      await seedWorkflowTemplates();
      log("[AI Systems] All AI agents, automations, and workflows seeded successfully");
    } catch (error) {
      console.error("[AI Systems] Error seeding AI systems:", error);
    }
    try {
      await seedSykesPortal();
    } catch (error) {
      console.error("[SykesSeed] Error seeding Sykes portal:", error);
    }
  });
})()
