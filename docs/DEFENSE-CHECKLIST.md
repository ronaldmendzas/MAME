# Defense Checklist - Security Assignment

## Scope
This checklist maps implemented controls to code evidence and test commands.
Use it in defense to prove what is complete now, including local password policy, local login lockout,
TOTP MFA, RBAC, admin role assignment, and immutable audit controls.

## 1) RBAC with Auditor Role
- Status: Implemented.
- Evidence:
  - Role enum includes auditor: apps/api/src/infrastructure/db/schema/enums.ts
  - Role guard supports auditor: apps/api/src/http/middleware/role.ts
  - Migration for role update: apps/api/drizzle/0003_add_auditor_role.sql
  - Read-only moderation queue access for auditor: apps/api/src/http/routes/moderation-routes.ts
  - Auditor blocked from moderation PATCH writes: apps/api/src/http/routes/moderation-routes.ts
- Verify:
  - npm run test -- apps/api/__tests__/auth/role-middleware.test.ts apps/api/__tests__/db/enums.test.ts

## 2) Admin Role Assignment Panel (RBAC Administration)
- Status: Implemented (backend + web panel).
- Evidence:
  - Admin API routes: apps/api/src/http/routes/admin-routes.ts
  - Admin routes mounted: apps/api/src/http/app.ts
  - User repository list/update role methods: apps/api/src/infrastructure/db/user-repository.ts
  - Admin page and guard: apps/web/src/app/admin/page.tsx and apps/web/src/components/admin/admin-guard.tsx
  - Admin role management UI: apps/web/src/components/admin/admin-users-panel.tsx
  - Admin nav visibility: apps/web/src/components/admin/admin-nav-link.tsx
- Verify:
  - npm run test -- apps/api/__tests__/admin/admin-routes.test.ts apps/web/src/lib/auth-role.test.ts

## 3) Security Event Logging
- Status: Implemented.
- Evidence:
  - Security event schema/table: apps/api/src/infrastructure/db/schema/security.ts
  - Event repository: apps/api/src/infrastructure/db/security-event-repository.ts
  - Domain contract: apps/api/src/domain/ports/security-event-repository.ts
  - Migration: apps/api/drizzle/0004_add_security_event_log.sql
  - Auth/role event logging integration: apps/api/src/http/middleware/auth.ts and apps/api/src/http/middleware/role.ts
  - Role update action logging: apps/api/src/http/routes/admin-routes.ts
- Verify:
  - npm run test -- apps/api/__tests__/security/security-events.test.ts

## 4) Read-Only Security Endpoint for Auditor/Admin
- Status: Implemented.
- Evidence:
  - Route: apps/api/src/http/routes/security-routes.ts
  - Handler with safe limit clamping: apps/api/src/http/routes/security-events.ts
  - Mounted under /security: apps/api/src/http/app.ts
- Verify:
  - npm run test -- apps/api/__tests__/security/security-events-route.test.ts

## 5) Append-Only Audit Logs
- Status: Implemented at database level.
- Evidence:
  - Trigger function and update/delete blocking triggers: apps/api/drizzle/0005_make_audit_logs_append_only.sql
  - Protected tables:
    - moderation_log
    - report_status_history
    - security_event_log
- Verify:
  - Apply migration in test/staging DB and attempt UPDATE/DELETE on those tables (must fail).

## 6) Local Password Policy and Secure Hash
- Status: Implemented.
- Evidence:
  - Password policy checks: apps/api/src/application/auth-local/password-policy.ts
  - Password hasher: apps/api/src/infrastructure/auth/password-hasher.ts
  - Local auth credential schema: apps/api/src/infrastructure/db/schema/local-auth.ts
  - Local auth migration: apps/api/drizzle/0006_add_local_auth_credentials.sql
- Verify:
  - npm run test -- apps/api/__tests__/auth/password-policy.test.ts apps/api/__tests__/auth/password-hasher.test.ts

## 7) Local Login Lockout Policy
- Status: Implemented.
- Behavior:
  - Generic invalid credential response (no user enumeration).
  - Counter increases on failed password attempts.
  - Account lockout on 5th failure for 15 minutes.
  - Counters reset after successful login.
- Evidence:
  - Use case: apps/api/src/application/auth-local/authenticate-local-login.ts
  - Tests: apps/api/__tests__/auth/authenticate-local-login.test.ts
- Verify:
  - npm run test -- apps/api/__tests__/auth/authenticate-local-login.test.ts

## 8) TOTP MFA (Generated and Verified by Application)
- Status: Implemented.
- Evidence:
  - TOTP service (RFC 6238): apps/api/src/infrastructure/auth/totp-service.ts
  - MFA secret encryption at rest: apps/api/src/infrastructure/auth/secret-cipher.ts
  - Enrollment/challenge use cases: apps/api/src/application/auth-local/mfa-enrollment.ts
  - Tests: apps/api/__tests__/auth/totp-service.test.ts
    apps/api/__tests__/auth/secret-cipher.test.ts
    apps/api/__tests__/auth/mfa-enrollment.test.ts
- Verify:
  - npm run test -- apps/api/__tests__/auth/totp-service.test.ts apps/api/__tests__/auth/secret-cipher.test.ts apps/api/__tests__/auth/mfa-enrollment.test.ts

## 9) Optional MFA Enforcement for Privileged Roles (JWT Claim Policy)
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

## 10) JWT Hardening and Claims Validation
- Status: Implemented.
- Evidence:
  - issuer/audience/time claim validation: apps/api/src/http/middleware/auth.ts
  - kid required + JWKS keyed cache handling: apps/api/src/http/middleware/auth.ts
- Verify:
  - npm run test -- apps/api/__tests__/auth/auth-middleware.test.ts apps/api/__tests__/auth/auth-middleware-jwt.test.ts apps/api/__tests__/auth/auth-verify-flow.test.ts

## 11) What Is Intentionally Out of Scope
- Full SIEM integration: out of scope for assignment, covered by internal security_event_log.
- Full backup-code and recovery workflow for local MFA: planned next iteration.
- Complete replacement of Clerk auth in production: local auth implemented in parallel track for academic defense.

## 12) 5-Minute Demo Script (Technical)
1. RBAC and least-privilege:
  - Show auditor read-only moderation route and denied write path.
2. Admin role assignment:
  - Open admin panel, change one test user role, show success.
3. Local password policy and hash:
  - Explain policy file and hasher tests.
4. Local login lockout:
  - Show test proving 5 failures cause lockout.
5. TOTP MFA:
  - Show enrollment + verification tests and encrypted secret storage.
6. Immutable auditing:
  - Show append-only trigger migration and security event route.

## 13) One-Command Sanity Pack
- npm run test -- \
  apps/api/__tests__/admin/admin-routes.test.ts \
  apps/api/__tests__/auth/authenticate-local-login.test.ts \
  apps/api/__tests__/auth/auth-middleware.test.ts \
  apps/api/__tests__/auth/auth-middleware-jwt.test.ts \
  apps/api/__tests__/auth/auth-verify-flow.test.ts \
  apps/api/__tests__/auth/mfa-enrollment.test.ts \
  apps/api/__tests__/auth/password-hasher.test.ts \
  apps/api/__tests__/auth/password-policy.test.ts \
  apps/api/__tests__/auth/role-middleware.test.ts \
  apps/api/__tests__/auth/secret-cipher.test.ts \
  apps/api/__tests__/auth/totp-service.test.ts \
  apps/api/__tests__/security/security-events.test.ts \
  apps/api/__tests__/security/security-events-route.test.ts \
  apps/api/__tests__/db/enums.test.ts \
  apps/api/__tests__/db/tables.test.ts \
  apps/api/__tests__/db/exports.test.ts
