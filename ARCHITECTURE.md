# Zara OS System Architecture

This document describes the technical architecture of Zara OS, an AI-native operating system for independent physician practices.

## Overview

Zara OS leverages a dual-plane architecture designed for high security and sub-200ms latency. All administrative, scheduling, and routing workloads execute on the **Cloudflare Edge Runtime (Tier 1)** to maintain responsive patient communication. Sensitive, high-computational Clinical Reasoning and Protected Health Information (PHI) processing execute on a secure, HIPAA-compliant **AWS EKS private cluster (Tier 2)** paired with Supabase Team.

```mermaid
graph TD
    subgraph Cloudflare Edge Plane (No PHI Retention)
        Patient[Patient Phone/SMS] -->|Twilio Voice/SMS| Edge[Cloudflare Worker]
        Edge -->|Hono Routing| DO[Orchestrator Durable Object]
        DO -->|Run Task| IA[Intake Agent]
        DO -->|Run Task| TA[Triage Agent]
        DO -->|Run Task| SA[Scheduling Agent]
        DO -->|Cryptographic Hash| CF_D1[(D1 Audit Ledger)]
    end
    
    subgraph Private HIPAA Cluster (EKS / PHI Safe)
        IA -->|mTLS / Secure Fetch| API[FastAPI Core]
        API -->|Read/Write PHI| DB[(Supabase Team / PostgreSQL)]
        API -->|EHR Query| Medplum[Medplum FHIR R4 API]
    end
```

## System Components

### 1. Cloudflare Workers Routing Layer
The entry point of patient interaction is Hono routed within Cloudflare Workers. Calls and texts are processed instantly at the edge nearest to the caller.

### 2. State-Preserving Durable Objects
The Agent Session is managed via Durable Objects, allowing real-time session tracking, multi-agent coordination, and active locking during critical scheduling operations to avoid double booking.

### 3. Core Specialized Worker Agents
- **Intake Agent:** Gathers demographics, validates insurance coverage, and schedules basic visits.
- **Triage Agent:** Filters administrative queries from urgent medical escalations.
- **Scheduling Agent:** Resolves provider availability dynamically through Google Calendar / EHR APIs.
- **Escalation Agent:** Directly routes critical patient symptoms or high-risk communications to on-call clinical staff via SMS and push notifications.

### 4. Append-Only Cryptographically Chained Ledger
For auditing compliance (HIPAA §164.312), every single state mutation, tool call, and routing decision is committed to an append-only transaction ledger on Cloudflare D1 with hash-chain integrity verification.

---

## Network & Security Topology

- **mTLS Validation:** Communication between Cloudflare Workers and EKS FastAPI Core is secured using mutually-authenticated TLS.
- **Zero-PHI Edge posturing:** Cloudflare KV and Durable Objects store only transient session tokens; no structured PHI is persisted on the edge runtime.
- **Data-at-Rest:** All DB records on Supabase and Medplum are AES-256 encrypted with KMS-managed customer keys.
