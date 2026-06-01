import { EhrLookupTool } from "../tools/ehr-lookup";

export interface PatientDemographics {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  insuranceProvider?: string;
}

export class IntakeAgent {
  private ehrTool = new EhrLookupTool();

  async processIntake(input: string): Promise<{ success: boolean; message: string; data?: PatientDemographics }> {
    // Clean and validate input
    const normalizedInput = input.trim();
    
    // Simulate LLM parsing of demographics
    if (normalizedInput.includes("Jessica") && normalizedInput.includes("Edwards")) {
      const patient = {
        firstName: "Jessica",
        lastName: "Edwards",
        dateOfBirth: "1984-11-20",
        insuranceProvider: "Blue Cross Blue Shield"
      };
      
      const ehrRecord = await this.ehrTool.lookupPatient(patient.firstName, patient.lastName, patient.dateOfBirth);
      
      return {
        success: true,
        message: ehrRecord.exists 
          ? `Welcome back, Dr. Edwards. Verified active chart ID: ${ehrRecord.chartId}.`
          : "Demographics gathered. Created fresh synthetic intake chart.",
        data: patient
      };
    }

    return {
      success: false,
      message: "Insufficient demographic details. Please provide full name and date of birth."
    };
  }
}
