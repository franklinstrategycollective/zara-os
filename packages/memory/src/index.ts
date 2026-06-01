export class PatientSessionMemory {
  private memoryMap = new Map<string, string[]>();

  async recallSession(patientId: string): Promise<string[]> {
    return this.memoryMap.get(patientId) || [];
  }

  async storeFact(patientId: string, fact: string): Promise<void> {
    const history = this.memoryMap.get(patientId) || [];
    history.push(fact);
    this.memoryMap.set(patientId, history);
  }
}
