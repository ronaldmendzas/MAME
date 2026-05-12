# Defense Evidence Matrix (Requirement -> Proof -> Result)

This document is the fastest way to defend the project in class.
For each rubric requirement, show one implementation proof and one execution proof.

## 1) Registration with Strong Password

- Requirement:
  - Register users with strong password validation.
- Implementation proof:
  - `apps/api/src/application/auth-local/password-policy.ts`
  - `apps/api/src/http/routes/auth-local-routes.ts` (`POST /auth/local/register`)
- Execution proof:
  - `npm run test -- apps/api/__tests__/auth/password-policy.test.ts apps/api/__tests__/auth/auth-local-routes.test.ts`
- Expected result:
  - Strong password accepted.
  - Weak password rejected with `VALIDATION_ERROR`.

## 2) MFA (Password + TOTP)

- Requirement:
  - Factor 1: password, Factor 2: TOTP.
- Implementation proof:
  - `apps/api/src/http/routes/auth-local-routes.ts` (`/login`, `/mfa/begin`, `/mfa/confirm`, `/mfa/verify`)
  - `apps/api/src/infrastructure/auth/totp-service.ts`
  - `apps/api/src/application/auth-local/mfa-enrollment.ts`
- Execution proof:
  - `npm run test -- apps/api/__tests__/auth/totp-service.test.ts apps/api/__tests__/auth/mfa-enrollment.test.ts apps/api/__tests__/auth/auth-local-routes.test.ts`
- Expected result:
  - Login returns `mfa_required` when MFA is enabled.
  - Valid code -> verified.
  - Invalid code -> denied.

## 3) RBAC (USER / ADMIN / AUDITOR)

- Requirement:
  - USER limited, ADMIN manages roles, AUDITOR read-only logs.
- Implementation proof:
  - `apps/api/src/http/middleware/role.ts`
  - `apps/api/src/http/routes/admin-routes.ts`
  - `apps/api/src/http/routes/security-routes.ts`
- Execution proof:
  - `npm run test -- apps/api/__tests__/admin/admin-routes.test.ts apps/api/__tests__/auth/role-middleware.test.ts`
- Expected result:
  - Non-admin denied on admin routes.
  - Auditor can read security events only.

## 4) Route Protection by Role

- Requirement:
  - Protect endpoints based on role.
- Implementation proof:
  - `apps/api/src/http/routes/moderation-routes.ts`
  - `apps/api/src/http/routes/security-routes.ts`
  - `apps/api/src/http/routes/admin-routes.ts`
- Execution proof:
  - `npm run test -- apps/api/__tests__/auth/role-middleware.test.ts apps/api/__tests__/admin/admin-routes.test.ts`
- Expected result:
  - Unauthorized role gets 403.

## 5) Access Logging (Success + Failure)

- Requirement:
  - Audit successful and failed access attempts.
- Implementation proof:
  - `apps/api/src/http/middleware/auth.ts`
  - `apps/api/src/http/routes/auth-local-routes.ts`
  - `apps/api/src/application/security-events.ts`
- Execution proof:
  - `npm run test -- apps/api/__tests__/security/security-events.test.ts apps/api/__tests__/security/security-events-route.test.ts`
- Expected result:
  - `auth_success`, `auth_failure`, and `access_denied` events are persisted.

## 6) Least Privilege Principle

- Requirement:
  - Users only see/modify what they should.
- Implementation proof:
  - `apps/api/src/http/routes/moderation-routes.ts` (auditor read-only)
  - `apps/web/src/components/admin/admin-guard.tsx` (admin-only panel)
- Execution proof:
  - `npm run test -- apps/api/__tests__/admin/admin-routes.test.ts apps/web/src/lib/auth-role.test.ts`
- Expected result:
  - Auditor cannot perform moderation write action.
  - Non-admin cannot access admin panel.

## 7) Confidentiality + Integrity

- Requirement:
  - Secure password hashing and immutable audit logs.
- Implementation proof:
  - `apps/api/src/infrastructure/auth/password-hasher.ts`
  - `apps/api/drizzle/0005_make_audit_logs_append_only.sql`
- Execution proof:
  - `npm run test -- apps/api/__tests__/auth/password-hasher.test.ts`
- Expected result:
  - Passwords are hashed with bcrypt.
  - Legacy pbkdf2 verification remains compatible.
  - Audit tables reject UPDATE/DELETE.

## 8) Ethics and Responsible Use

- Requirement:
  - Privacy policy and responsible-use framing.
- Implementation proof:
  - `apps/web/src/components/privacy-notice.tsx`
  - `docs/DEFENSE-VIDEO-SCRIPT.md`
- Execution proof:
  - Show sign-up page privacy notice and mention controlled-lab scope in demo intro.

## Live Demo (5 Cases) - Ready Sequence

1. Strong password registration succeeds.
2. Weak password registration fails.
3. Login fails 5 times and enters lockout.
4. MFA enrollment + valid and invalid TOTP verification.
5. Role-based denial on admin/security route.

Use this helper script for demo execution:

- `scripts/demo-auth-local.ps1`
