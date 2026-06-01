export interface TriageResult {
  category: "administrative" | "clinical-routine" | "clinical-urgent";
  recommendedRouting: string;
  requiresHumanReview: boolean;
}

export class TriageAgent {
  async evaluateSymptom(utterance: string): Promise<TriageResult> {
    const text = utterance.toLowerCase();

    if (text.includes("chest pain") || text.includes("shortness of breath") || text.includes("difficulty breathing")) {
      return {
        category: "clinical-urgent",
        recommendedRouting: "direct-to-oncall-provider-sms",
        requiresHumanReview: true
      };
    }

    if (text.includes("refill") || text.includes("prescription") || text.includes("schedule")) {
      return {
        category: "clinical-routine",
        recommendedRouting: "scheduling-agent",
        requiresHumanReview: false
      };
    }

    return {
      category: "administrative",
      recommendedRouting: "general-inbox",
      requiresHumanReview: false
    };
  }
}
