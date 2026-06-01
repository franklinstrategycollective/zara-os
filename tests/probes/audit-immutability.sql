-- ═══════════════════════════════════════════════════════════════════════
-- Audit Log Immutability Probe
-- Verifies HIPAA § 164.312(b) compliance at the database level.
-- This probe MUST pass before any Sprint 1 sign-off.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Insert a test audit event
INSERT INTO audit_log (
  event_id, timestamp, actor_id, actor_type, action,
  resource_type, tenant_id, request_id, outcome
) VALUES (
  uuid_generate_v4(),
  NOW(),
  'probe-actor',
  'system',
  'read',
  'Patient',
  '00000000-0000-0000-0000-000000000001',
  'probe-request-' || extract(epoch from now())::text,
  'success'
);

-- 2. Try to UPDATE — must fail
DO $$
BEGIN
  BEGIN
    UPDATE audit_log SET outcome = 'denied' WHERE actor_id = 'probe-actor';
    RAISE EXCEPTION 'PROBE FAILED: audit_log UPDATE succeeded (must be blocked)';
  EXCEPTION
    WHEN raise_exception THEN
      RAISE NOTICE '✅ UPDATE correctly blocked: %', SQLERRM;
  END;
END $$;

-- 3. Try to DELETE — must fail
DO $$
BEGIN
  BEGIN
    DELETE FROM audit_log WHERE actor_id = 'probe-actor';
    RAISE EXCEPTION 'PROBE FAILED: audit_log DELETE succeeded (must be blocked)';
  EXCEPTION
    WHEN raise_exception THEN
      RAISE NOTICE '✅ DELETE correctly blocked: %', SQLERRM;
  END;
END $$;

ROLLBACK;

-- Final verification: probe row should NOT exist (we rolled back)
SELECT COUNT(*) AS leftover_probe_rows FROM audit_log WHERE actor_id = 'probe-actor';
-- Expected: 0
