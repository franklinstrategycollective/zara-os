export interface EHRChart {
  chartId: string;
  patientId: string;
  createdDate: string;
  status: "active" | "inactive" | "archived";
}

export interface PatientEncounter {
  encounterId: string;
  patientId: string;
  providerId: string;
  dateTime: string;
  reason: string;
  notes?: string;
}
