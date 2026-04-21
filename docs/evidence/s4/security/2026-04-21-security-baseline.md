# Security Baseline Evidence - 2026-04-21

Scope: Sprint 4 Phase B baseline validation.
Branch: sprint-4/release-hardening

## Tooling Availability

- OWASP ZAP CLI availability check:
  - Command: where zap.bat && where zap.sh
  - Result: not found on this machine.

## Executed Security Test Packs

1. HTTP security middleware and app-level headers
- Command:
  - npm run test -- apps/api/__tests__/http/security.test.ts apps/api/__tests__/http/app.test.ts
- Result:
  - 2 files passed
  - 21 tests passed

2. Security event logging and role-gated endpoint
- Command:
  - npm run test -- apps/api/__tests__/security/security-events.test.ts apps/api/__tests__/security/security-events-route.test.ts
- Result:
  - 2 files passed
  - 6 tests passed

3. Auth middleware and JWT verification flow
- Command:
  - npm run test -- apps/api/__tests__/auth/auth-middleware.test.ts apps/api/__tests__/auth/auth-middleware-jwt.test.ts apps/api/__tests__/auth/auth-verify-flow.test.ts
- Result:
  - 3 files passed
  - 17 tests passed

## Summary

- Total in this baseline batch:
  - 7 test files passed
  - 44 tests passed
- Current blocker to fully close OWASP criterion:
  - ZAP CLI not installed in current environment.

## Next Actions

1. Install OWASP ZAP or run ZAP in CI/staging pipeline.
2. Execute automated scan against staging target.
3. Record critical/high findings and remediation cycle.
4. Re-run until critical/high = 0.
