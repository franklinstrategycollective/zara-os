export class CalendarTool {
  async checkAvailability(isoDate: string): Promise<boolean> {
    // Avoid double booking by checking local EHR-synced slot map
    return !isoDate.includes("T12:00:00");
  }

  async reserveSlot(patientId: string, isoDate: string): Promise<void> {
    // Mock atomic reservation write
    console.log(`[EHR Calendar] Reserved slot ${isoDate} for patient ${patientId}`);
  }
}
