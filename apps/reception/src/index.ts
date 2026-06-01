import { Hono } from "hono";
import { IntakeAgent } from "./agents/intake-agent";
import { TriageAgent } from "./agents/triage-agent";
import { SchedulingAgent } from "./agents/scheduling-agent";
import { EscalationAgent } from "./agents/escalation-agent";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "healthy", service: "zara-os-reception" }));

app.post("/api/v1/voice/intake", async (c) => {
  const body = await c.req.json();
  const utterance = body.utterance || "";
  
  const intakeAgent = new IntakeAgent();
  const triageAgent = new TriageAgent();
  
  // Triage check first
  const triage = await triageAgent.evaluateSymptom(utterance);
  
  if (triage.category === "clinical-urgent") {
    const escAgent = new EscalationAgent();
    await escAgent.triggerUrgentEscalation(utterance, "Incoming Anonymous Caller");
    return c.json({
      routing: "escalated",
      triage,
      message: "Emergency clinical safety protocol engaged. Outbound provider notified."
    });
  }

  const intakeResult = await intakeAgent.processIntake(utterance);
  
  return c.json({
    routing: "reception",
    triage,
    intakeResult
  });
});

export default app;
