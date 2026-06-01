import * as crypto from "crypto";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  patientId?: string;
  previousHash: string;
  hash: string;
}

export class CryptographicAuditLogger {
  private lastHash: string = "0000000000000000000000000000000000000000000000000000000000000000";

  createLog(action: string, userId: string, patientId?: string): AuditLogEntry {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Secure hash chaining
    const rawPayload = `${id}|${timestamp}|${action}|${userId}|${patientId || ""}|${this.lastHash}`;
    const hash = crypto.createHash("sha256").update(rawPayload).digest("hex");
    
    const entry: AuditLogEntry = {
      id,
      timestamp,
      action,
      userId,
      patientId,
      previousHash: this.lastHash,
      hash
    };

    this.lastHash = hash;
    return entry;
  }
}
