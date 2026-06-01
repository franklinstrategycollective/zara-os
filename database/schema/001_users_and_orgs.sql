-- ═══════════════════════════════════════════════════════════════════════
-- Zara OS — Schema 001: Users, Organizations, Tenancy
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tenants (practices, hospitals) ───
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('practice', 'hospital', 'fqhc', 'critical_access_hospital')),
  npi             TEXT,
  tax_id_encrypted BYTEA,
  kms_key_id      TEXT NOT NULL,
  baa_signed_at   TIMESTAMPTZ,
  baa_document_url TEXT,
  status          TEXT NOT NULL DEFAULT 'pending_baa' CHECK (status IN ('pending_baa', 'active', 'suspended', 'terminated')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_status ON tenants(status);

-- ─── Users ───
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  email           TEXT NOT NULL,
  email_hash      TEXT NOT NULL,  -- deterministic encrypted for lookup
  npi             TEXT,
  role            TEXT NOT NULL CHECK (role IN ('provider', 'ma', 'admin', 'billing', 'patient', 'system')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  mfa_enrolled    BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_method      TEXT CHECK (mfa_method IN ('totp', 'webauthn', NULL)),
  last_login_at   TIMESTAMPTZ,
  password_hash   TEXT,  -- argon2id; null for SSO-only users
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email_hash)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(tenant_id, role);
CREATE INDEX idx_users_email_hash ON users(email_hash);

-- ─── Sessions ───
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE revoked_at IS NULL;
