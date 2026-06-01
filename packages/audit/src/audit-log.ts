/**
 * Zara OS — Audit Log SDK
 * Every PHI-touching operation MUST call AuditLog.write() before and after.
 * Per HIPAA § 164.312(b) and ADR-008.
 */
import { z } from "zod";

export const AuditEventSchema = z.object({
  event_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  actor_id: z.string(),
  actor_type: z.enum([
    "human",
    "agent_p",
    "agent_a",
    "agent_z",
    "agent_r",
    "agent_m",
    "system",
  ]),
  action: z.enum(["create", "read", "update", "delete", "export", "login", "logout"]),
  resource_type: z.string(),
  resource_id: z.string().nullable(),
  patient_id: z.string().nullable(),
  tenant_id: z.string(),
  justification: z.string().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  request_id: z.string(),
  outcome: z.enum(["success", "denied", "error"]),
  phi_fields_accessed: z.array(z.string()),
  agent_reasoning_trace_id: z.string().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface AuditSink {
  write(event: AuditEvent): Promise<void>;
}

/**
 * S3-backed immutable audit sink (production).
 * Writes to bucket with Object Lock in compliance mode.
 */
export class S3AuditSink implements AuditSink {
  constructor(
    private bucket: string,
    private s3Client: { send: (cmd: unknown) => Promise<unknown> },
  ) {}

  async write(event: AuditEvent): Promise<void> {
    const validated = AuditEventSchema.parse(event);
    const key = `${validated.tenant_id}/${validated.timestamp.slice(0, 10)}/${validated.event_id}.json`;
    // PutObjectCommand with ObjectLockMode=COMPLIANCE
    // Real impl in Sprint 1.5 when AWS provisioned
    void this.bucket;
    void this.s3Client;
    void key;
    void validated;
    throw new Error("S3AuditSink not yet implemented — use LocalAuditSink for dev");
  }
}

/**
 * Local dev audit sink — writes to Postgres audit_log table.
 */
export class PostgresAuditSink implements AuditSink {
  constructor(private db: { execute: (sql: string, params: unknown[]) => Promise<unknown> }) {}

  async write(event: AuditEvent): Promise<void> {
    const validated = AuditEventSchema.parse(event);
    await this.db.execute(
      `INSERT INTO audit_log (
        event_id, timestamp, actor_id, actor_type, action,
        resource_type, resource_id, patient_id, tenant_id,
        justification, ip_address, user_agent, request_id,
        outcome, phi_fields_accessed, agent_reasoning_trace_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        validated.event_id,
        validated.timestamp,
        validated.actor_id,
        validated.actor_type,
        validated.action,
        validated.resource_type,
        validated.resource_id,
        validated.patient_id,
        validated.tenant_id,
        validated.justification,
        validated.ip_address,
        validated.user_agent,
        validated.request_id,
        validated.outcome,
        JSON.stringify(validated.phi_fields_accessed),
        validated.agent_reasoning_trace_id,
        JSON.stringify(validated.metadata ?? {}),
      ],
    );
  }
}

export class AuditLog {
  constructor(private sink: AuditSink) {}

  async write(event: Omit<AuditEvent, "event_id" | "timestamp">): Promise<void> {
    const full: AuditEvent = {
      ...event,
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    await this.sink.write(full);
  }
}
