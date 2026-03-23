# 5-Minute Defense Video Script

## 0:00 - 0:30 Context and Objectives
1. Present objective: prove authentication, authorization, MFA, RBAC, audit logs, and least privilege.
2. Mention ethical scope: controlled lab environment only, no unauthorized testing.

## 0:30 - 1:10 Strong Password and Secure Hash
1. Show password policy file:
- apps/api/src/application/auth-local/password-policy.ts
2. Show hash service:
- apps/api/src/infrastructure/auth/password-hasher.ts
3. Explain: plaintext password is never stored.

## 1:10 - 1:50 Local Login and Lockout
1. Show login use case:
- apps/api/src/application/auth-local/authenticate-local-login.ts
2. Explain lockout rule: 5 failed attempts = 15 minutes.
3. Run/mention test evidence:
- apps/api/__tests__/auth/authenticate-local-login.test.ts

## 1:50 - 2:40 MFA TOTP by Application
1. Show TOTP service:
- apps/api/src/infrastructure/auth/totp-service.ts
2. Show MFA enrollment/challenge use cases:
- apps/api/src/application/auth-local/mfa-enrollment.ts
3. Show encrypted secret storage:
- apps/api/src/infrastructure/auth/secret-cipher.ts
4. Run/mention tests:
- apps/api/__tests__/auth/totp-service.test.ts
- apps/api/__tests__/auth/mfa-enrollment.test.ts

## 2:40 - 3:30 RBAC and Least Privilege
1. Show role middleware:
- apps/api/src/http/middleware/role.ts
2. Show moderation route permissions:
- apps/api/src/http/routes/moderation-routes.ts
3. Explicitly show auditor is read-only and cannot PATCH moderation actions.

## 3:30 - 4:20 Admin Role Management Panel
1. Show backend admin routes:
- apps/api/src/http/routes/admin-routes.ts
2. Show frontend admin panel:
- apps/web/src/app/admin/page.tsx
- apps/web/src/components/admin/admin-users-panel.tsx
3. Demo role change by admin user.

## 4:20 - 5:00 Audit Integrity and Closure
1. Show append-only trigger migration:
- apps/api/drizzle/0005_make_audit_logs_append_only.sql
2. Show security events endpoint:
- apps/api/src/http/routes/security-routes.ts
3. Final statement mapping to rubric:
- MFA complete
- secure password hash
- RBAC
- audit logs
- least privilege
- confidentiality and integrity

## Suggested 5 Study Cases for Live Demonstration
1. Valid registration path with strong password accepted.
2. Weak password rejected by policy.
3. Login failed 5 times then lockout activated.
4. Login with MFA enabled: correct and incorrect TOTP code.
5. USER denied on admin route, ADMIN allowed and role update recorded.
