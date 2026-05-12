# Security Baseline Evidence - 2026-04-21

Scope: Sprint 4 Phase B baseline validation.
Branch: sprint-4/release-hardening

## Tooling Availability

- OWASP ZAP CLI availability check:
  - Command: where zap.bat && where zap.sh
  - Result: not found on this machine.
- OWASP ZAP via container (GHCR):
  - Command: docker run --rm ghcr.io/zaproxy/zaproxy:stable zap.sh -version
  - Result: failed to resolve ghcr.io host in current environment.
- OWASP ZAP via Docker Hub fallback:
  - Command: docker run --rm zaproxy/zap-stable zap.sh -version
  - Result: image pull started successfully but download speed is too slow for current session window.
  - Action: process stopped after partial pull to avoid blocking Sprint 4 execution.

## Executed Security Test Packs

1. HTTP security middleware and app-level headers

- Command:
  - npm run test -- apps/api/**tests**/http/security.test.ts apps/api/**tests**/http/app.test.ts
- Result:
  - 2 files passed
  - 21 tests passed

2. Security event logging and role-gated endpoint

- Command:
  - npm run test -- apps/api/**tests**/security/security-events.test.ts apps/api/**tests**/security/security-events-route.test.ts
- Result:
  - 2 files passed
  - 6 tests passed

3. Auth middleware and JWT verification flow

- Command:
  - npm run test -- apps/api/**tests**/auth/auth-middleware.test.ts apps/api/**tests**/auth/auth-middleware-jwt.test.ts apps/api/**tests**/auth/auth-verify-flow.test.ts
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
2. Prefer CI/staging runner with stable bandwidth for container pull.
3. Execute automated scan against staging target.
4. Record critical/high findings and remediation cycle.
5. Re-run until critical/high = 0.
