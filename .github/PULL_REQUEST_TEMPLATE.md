## What
<!-- Brief description of the change -->

## Why
<!-- Why this change is needed -->

## How
<!-- High-level approach -->

## Testing
<!-- How was this tested? -->
- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] E2E tests pass (if applicable)
- [ ] FHIR conformance tests pass (if FHIR-related)
- [ ] Manual test plan executed

## Risk Tier
- [ ] 🟢 Green — non-PHI, non-prod
- [ ] 🟡 Yellow — schema, deps, staging
- [ ] 🔴 Red — production, PHI, money, auth, deletes (REQUIRES RICK + JESSICA APPROVAL)

## HIPAA Checklist (required for any PHI-touching change)
- [ ] No PHI in code, tests, or fixtures
- [ ] Audit logging in place for new PHI access paths
- [ ] Encryption verified (at-rest + in-transit)
- [ ] Minimum-necessary access principle applied
- [ ] BAA registry updated if new vendor introduced
- [ ] data-flows.yaml updated if new data flow introduced

## Screenshots / Demo
<!-- For UI changes -->

## Related Issues
<!-- Closes #N -->
