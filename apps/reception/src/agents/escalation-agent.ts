import { SmsTool } from "../tools/sms";

export class EscalationAgent {
  private smsTool = new SmsTool();

  async triggerUrgentEscalation(symptomSummary: string, patientName: string): Promise<{ alerted: boolean; confirmationId: string }> {
    const alertMessage = `🚨 URGENT CLINICAL ESCALATION: ${patientName} reports '${symptomSummary}'. Respond immediately.`;
    
    // Send priority alert to on-call physician
    const result = await this.smsTool.sendUrgentAlert("555-0199", alertMessage);

    return {
      alerted: result.success,
      confirmationId: result.id
    };
  }
}
