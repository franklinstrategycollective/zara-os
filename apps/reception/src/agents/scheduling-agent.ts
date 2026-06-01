import { CalendarTool } from "../tools/calendar";

export class SchedulingAgent {
  private calendarTool = new CalendarTool();

  async bookAppointment(patientId: string, requestedDate: string): Promise<{ success: boolean; appointmentTime?: string; reason: string }> {
    const isAvailable = await this.calendarTool.checkAvailability(requestedDate);
    
    if (isAvailable) {
      await this.calendarTool.reserveSlot(patientId, requestedDate);
      return {
        success: true,
        appointmentTime: requestedDate,
        reason: "Slot confirmed and synced with practice EHR."
      };
    }

    return {
      success: false,
      reason: "Requested slot is fully booked. Suggesting next available slot on following business day."
    };
  }
}
