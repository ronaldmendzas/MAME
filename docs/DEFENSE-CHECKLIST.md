# Defense Checklist - Security Assignment

## Scope
This checklist maps the implemented security controls to concrete evidence in code and test commands.
Use it during defense to prove what is implemented, what is configurable, and what is intentionally out of scope.

## 1) RBAC with Auditor Role
- Status: Implemented.
- Evidence:
  - Role enum includes auditor: apps/api/src/infrastructure/db/schema/enums.ts
  - Role guard supports auditor: apps/api/src/http/middleware/role.ts
  - Migration for role update: apps/api/drizzle/0003_add_auditor_role.sql
  - Read-only moderation queue access for auditor: apps/api/src/http/routes/moderation-routes.ts
- Verify:
  - npm run test -- apps/api/__tests__/auth/role-middleware.test.ts apps/api/__tests__/db/enums.test.ts

## 2) Security Event Logging
- Status: Implemented.
- Evidence:
  - Security event schema/table: apps/api/src/infrastructure/db/schema/security.ts
  - Event repository: apps/api/src/infrastructure/db/security-event-repository.ts
  - Domain contract: apps/api/src/domain/ports/security-event-repository.ts
  - Migration: apps/api/drizzle/0004_add_security_event_log.sql
  - Auth/role event logging integration: apps/api/src/http/middleware/auth.ts and apps/api/src/http/middleware/role.ts
- Verify:
  - npm run test -- apps/api/__tests__/security/security-events.test.ts

## 3) Read-Only Security Endpoint for Auditor/Admin
- Status: Implemented.
- Evidence:
  - Route: apps/api/src/http/routes/security-routes.ts
  - Handler with safe limit clamping: apps/api/src/http/routes/security-events.ts
  - Mounted under /security: apps/api/src/http/app.ts
- Verify:
  - npm run test -- apps/api/__tests__/security/security-events-route.test.ts

## 4) Append-Only Audit Logs
- Status: Implemented at database level.
- Evidence:
  - Trigger function and update/delete blocking triggers: apps/api/drizzle/0005_make_audit_logs_append_only.sql
  - Protected tables:
    - moderation_log
    - report_status_history
    - security_event_log
- Verify:
  - Apply migration in test/staging DB and attempt UPDATE/DELETE on those tables (must fail).

## 5) Optional MFA Enforcement for Privileged Roles
- Status: Implemented as configurable control.
- Behavior:
  - If REQUIRE_MFA_FOR_PRIVILEGED=true, roles admin/moderator/auditor require MFA signal in JWT (amr/acr).
  - If missing, request is denied with 401.
- Evidence:
  - Env binding: apps/api/src/env.ts
  - Runtime config example: apps/api/wrangler.toml and .env.example
  - Enforcement logic: apps/api/src/http/middleware/auth.ts
  - Tests: apps/api/__tests__/auth/auth-verify-flow.test.ts
- Verify:
  - npm run test -- apps/api/__tests__/auth/auth-verify-flow.test.ts

## 6) JWT Hardening and Claims Validation
- Status: Implemented.
- Evidence:
  - issuer/audience/time claim validation: apps/api/src/http/middleware/auth.ts
  - kid required + JWKS keyed cache handling: apps/api/src/http/middleware/auth.ts
- Verify:
  - npm run test -- apps/api/__tests__/auth/auth-middleware.test.ts apps/api/__tests__/auth/auth-middleware-jwt.test.ts apps/api/__tests__/auth/auth-verify-flow.test.ts

## 7) What Is Intentionally Not Implemented Now
- Full SIEM integration: not required for assignment defense; internal security_event_log provides core traceability.
- Custom MFA provider logic: not needed; enforcement relies on identity provider claims and policy flag.
- Rework of JWT/JWKS architecture: not needed; current implementation already hardened.

## 8) 5-Minute Demo Script
1. Show role model and auditor access boundaries.
   - Open role enum and moderation route.
2. Show security event schema and endpoint.
   - Open security schema and /security/events route.
3. Prove denied access logging.
   - Explain auth/role middleware event logging paths.
4. Show append-only DB control.
   - Open migration 0005 and point to triggers blocking UPDATE/DELETE.
5. Show MFA toggle behavior.
   - Set REQUIRE_MFA_FOR_PRIVILEGED=true and run auth verification tests.

## 9) One-Command Sanity Pack
- npm run test -- \
  apps/api/__tests__/auth/auth-middleware.test.ts \
  apps/api/__tests__/auth/auth-middleware-jwt.test.ts \
  apps/api/__tests__/auth/auth-verify-flow.test.ts \
  apps/api/__tests__/auth/role-middleware.test.ts \
  apps/api/__tests__/security/security-events.test.ts \
  apps/api/__tests__/security/security-events-route.test.ts \
  apps/api/__tests__/db/enums.test.ts \
  apps/api/__tests__/db/tables.test.ts \
  apps/api/__tests__/db/exports.test.ts
