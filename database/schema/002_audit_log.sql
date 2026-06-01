-- ═══════════════════════════════════════════════════════════════════════
-- Zara OS — Schema 002: Immutable Audit Log
-- HIPAA § 164.312(b) requirement
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE audit_log (
  event_id        UUID PRIMARY KEY,
  timestamp       TIMESTAMPTZ NOT NULL,
  actor_id        TEXT NOT NULL,
  actor_type      TEXT NOT NULL CHECK (actor_type IN ('human', 'agent_p', 'agent_a', 'agent_z', 'agent_r', 'agent_m', 'system')),
  action          TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'export', 'login', 'logout')),
  resource_type   TEXT NOT NULL,
  resource_id     TEXT,
  patient_id      TEXT,
  tenant_id       UUID NOT NULL,
  justification   TEXT,
  ip_address      INET,
  user_agent      TEXT,
  request_id      TEXT NOT NULL,
  outcome         TEXT NOT NULL CHECK (outcome IN ('success', 'denied', 'error')),
  phi_fields_accessed JSONB NOT NULL DEFAULT '[]'::jsonb,
  agent_reasoning_trace_id UUID,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for compliance queries
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, timestamp DESC);
CREATE INDEX idx_audit_log_patient ON audit_log(patient_id, timestamp DESC) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action, timestamp DESC);

-- HIPAA: prevent any update or delete on audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is immutable per HIPAA § 164.312(b)';
END;

$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
