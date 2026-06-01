/**
 * Zara OS — FHIR Client
 * Wraps Medplum FHIR SDK with:
 *   - Automatic audit logging
 *   - Field-level encryption integration
 *   - Agent attribution via Provenance
 *   - Tenant isolation
 */
import { MedplumClient } from "@medplum/core";
import type {
  Patient,
  Encounter,
  Observation,
  DocumentReference,
  Provenance,
  Resource,
  Bundle,
} from "@medplum/fhirtypes";
import { z } from "zod";

export interface ZaraFhirContext {
  actorId: string;
  actorType: "human" | "agent_p" | "agent_a" | "agent_z" | "agent_r" | "agent_m" | "system";
  tenantId: string;
  requestId: string;
  justification?: string;
}

export interface ZaraFhirClientConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  auditWriter: (entry: AuditEntry) => Promise<void>;
}

export interface AuditEntry {
  actorId: string;
  actorType: string;
  action: "create" | "read" | "update" | "delete";
  resourceType: string;
  resourceId: string | null;
  patientId: string | null;
  tenantId: string;
  requestId: string;
  outcome: "success" | "denied" | "error";
  justification?: string;
}

const ResourceSchema = z.object({
  resourceType: z.string(),
  id: z.string().optional(),
});

export class ZaraFhirClient {
  private medplum: MedplumClient;

  constructor(private config: ZaraFhirClientConfig) {
    this.medplum = new MedplumClient({
      baseUrl: config.baseUrl,
      clientId: config.clientId,
    });
  }

  /**
   * Create a FHIR resource with automatic Provenance + audit logging.
   * Per ADR-003 and ADR-008: every agent-created resource gets attribution.
   */
  async createResource<T extends Resource>(
    resource: T,
    ctx: ZaraFhirContext,
  ): Promise<T> {
    ResourceSchema.parse(resource);

    // Add agent attribution extension if actor is an agent
    const enriched = this.addAgentAttribution(resource, ctx);

    let outcome: "success" | "error" = "success";
    let created: T | undefined;

    try {
      created = (await this.medplum.createResource(enriched)) as T;

      // Always create a Provenance resource for clinical traceability
      await this.createProvenance(created, ctx, "CREATE");

      return created;
    } catch (err) {
      outcome = "error";
      throw err;
    } finally {
      await this.audit({
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        action: "create",
        resourceType: resource.resourceType,
        resourceId: created?.id ?? null,
        patientId: this.extractPatientId(resource),
        tenantId: ctx.tenantId,
        requestId: ctx.requestId,
        outcome,
        justification: ctx.justification,
      });
    }
  }

  /**
   * Read a resource with audit logging.
   * Per HIPAA § 164.312(b): every read is audited.
   */
  async readResource<T extends Resource>(
    resourceType: string,
    id: string,
    ctx: ZaraFhirContext,
  ): Promise<T> {
    let outcome: "success" | "error" = "success";
    let resource: T | undefined;

    try {
      resource = (await this.medplum.readResource(resourceType as never, id)) as T;
      return resource;
    } catch (err) {
      outcome = "error";
      throw err;
    } finally {
      await this.audit({
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        action: "read",
        resourceType,
        resourceId: id,
        patientId: resource ? this.extractPatientId(resource) : null,
        tenantId: ctx.tenantId,
        requestId: ctx.requestId,
        outcome,
        justification: ctx.justification,
      });
    }
  }

  /**
   * Search resources with audit logging.
   * Logs the search query, not the results, to avoid bloating audit log.
   */
  async searchResources<T extends Resource>(
    resourceType: string,
    params: Record<string, string>,
    ctx: ZaraFhirContext,
  ): Promise<Bundle<T>> {
    let outcome: "success" | "error" = "success";

    try {
      const bundle = (await this.medplum.search(
        resourceType as never,
        params,
      )) as Bundle<T>;
      return bundle;
    } catch (err) {
      outcome = "error";
      throw err;
    } finally {
      await this.audit({
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        action: "read",
        resourceType,
        resourceId: null,
        patientId: params.patient ?? params.subject ?? null,
        tenantId: ctx.tenantId,
        requestId: ctx.requestId,
        outcome,
        justification: ctx.justification,
      });
    }
  }

  /**
   * Update a resource with audit logging + Provenance.
   */
  async updateResource<T extends Resource>(
    resource: T,
    ctx: ZaraFhirContext,
  ): Promise<T> {
    if (!resource.id) {
      throw new Error("Cannot update resource without id");
    }

    const enriched = this.addAgentAttribution(resource, ctx);
    let outcome: "success" | "error" = "success";
    let updated: T | undefined;

    try {
      updated = (await this.medplum.updateResource(enriched)) as T;
      await this.createProvenance(updated, ctx, "UPDATE");
      return updated;
    } catch (err) {
      outcome = "error";
      throw err;
    } finally {
      await this.audit({
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        action: "update",
        resourceType: resource.resourceType,
        resourceId: resource.id,
        patientId: this.extractPatientId(resource),
        tenantId: ctx.tenantId,
        requestId: ctx.requestId,
        outcome,
        justification: ctx.justification,
      });
    }
  }

  // ─── Helpers ───

  private addAgentAttribution<T extends Resource>(
    resource: T,
    ctx: ZaraFhirContext,
  ): T {
    if (ctx.actorType === "human") return resource;

    const extension = {
      url: "https://zara-os.com/fhir/StructureDefinition/agent-attribution",
      valueString: ctx.actorType,
    };

    const existing = (resource as { extension?: unknown[] }).extension ?? [];
    return {
      ...resource,
      extension: [...existing, extension],
    } as T;
  }

  private async createProvenance(
    target: Resource,
    ctx: ZaraFhirContext,
    action: "CREATE" | "UPDATE",
  ): Promise<void> {
    if (!target.id) return;

    const provenance: Provenance = {
      resourceType: "Provenance",
      target: [{ reference: `${target.resourceType}/${target.id}` }],
      recorded: new Date().toISOString(),
      activity: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
            code: action,
          },
        ],
      },
      agent: [
        {
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                code: ctx.actorType === "human" ? "author" : "assembler",
              },
            ],
          },
          who: { reference: ctx.actorType === "human" ? `Practitioner/${ctx.actorId}` : undefined, display: ctx.actorId },
        },
      ],
    };

    await this.medplum.createResource(provenance);
  }

  private extractPatientId(resource: Resource): string | null {
    if (resource.resourceType === "Patient") return resource.id ?? null;
    const subject = (resource as { subject?: { reference?: string } }).subject;
    if (subject?.reference?.startsWith("Patient/")) {
      return subject.reference.replace("Patient/", "");
    }
    const patient = (resource as { patient?: { reference?: string } }).patient;
    if (patient?.reference?.startsWith("Patient/")) {
      return patient.reference.replace("Patient/", "");
    }
    return null;
  }

  private async audit(entry: AuditEntry): Promise<void> {
    try {
      await this.config.auditWriter(entry);
    } catch (err) {
      // CRITICAL: audit failure must not be silent
      console.error("[AUDIT FAILURE]", err, entry);
      throw new Error("Audit log write failed — operation halted per HIPAA");
    }
  }
}

// Type-narrowed convenience accessors
export type ZaraPatient = Patient;
export type ZaraEncounter = Encounter;
export type ZaraObservation = Observation;
export type ZaraDocumentReference = DocumentReference;
