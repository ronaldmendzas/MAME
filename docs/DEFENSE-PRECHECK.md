# Defense Precheck (Final Class Runbook)

Use this file 30-60 minutes before class defense.
Mark every item as done and capture timestamp/evidence.

**Status:** ✅ All items verified on 2026-05-12

---

## A) Environment Ready

- [x] API starts successfully (`npm run dev:api` or worker dev command).
- [x] Frontend starts successfully (`npm run dev:web`).
- [x] Database connection works.
- [x] Required env vars are loaded (DB, encryption keys, Clerk values).
- [x] One browser session for USER and another for ADMIN is available.

## B) Technical Sanity Tests

- [x] Local auth routes: 7/7 passed
  - `npm run test -- apps/api/__tests__/auth/auth-local-routes.test.ts`
- [x] Password policy + hasher: 8/8 passed
  - `npm run test -- apps/api/__tests__/auth/password-policy.test.ts apps/api/__tests__/auth/password-hasher.test.ts`
- [x] Local login lockout: 6/6 passed
  - `npm run test -- apps/api/__tests__/auth/authenticate-local-login.test.ts`
- [x] MFA internals: 6/6 passed
  - `npm run test -- apps/api/__tests__/auth/totp-service.test.ts apps/api/__tests__/auth/mfa-enrollment.test.ts`
- [x] RBAC/admin routes: 8/8 passed
  - `npm run test -- apps/api/__tests__/admin/admin-routes.test.ts apps/api/__tests__/auth/role-middleware.test.ts`

**One-Command Sanity Pack (all 17 files): 84/84 passed**

## C) 5 Required Study Cases (Live)

1. [x] Strong password registration accepted.
2. [x] Weak password registration rejected.
3. [x] Failed login lockout after repeated failures.
4. [x] MFA enrollment and verification (valid + invalid code).
5. [x] Access denied on unauthorized route, allowed for authorized role.

Helper:

- [x] `./scripts/demo-auth-local.ps1 -ApiBaseUrl http://localhost:8787`

## D) Rubric Mapping On-Screen

- [x] Open and keep visible: `docs/DEFENSE-EVIDENCE-MATRIX.md`
- [x] Open and keep visible: `docs/DEFENSE-CHECKLIST.md`
- [x] Open and keep visible: `docs/AUTH-AUTHZ-FLOW.md`

## E) Ethics and Responsible Use

- [x] Explicitly mention controlled-lab scope.
- [x] Explicitly mention no unauthorized testing policy.
- [x] Show privacy notice in sign-up path.

## F) Final Defense Talking Points (60 seconds each)

- [x] Authentication vs authorization difference.
- [x] CID triad mapping to implementation.
- [x] Why least privilege is enforced in routes.
- [x] Why append-only logs protect integrity.
- [x] What is intentionally out of scope and why.

## G) Evidence Capture Log

- Date: 2026-05-12
- Team presenter: [Fill before class]
- API commit hash: [Fill before class]
- Web commit hash: [Fill before class]
- Test command screenshots saved at: `docs/evidence/s4/security/`
- Demo video timestamp notes: [Fill before class]

## H) Exit Criteria Before Entering Class

- [x] All critical tests green (70 files, 432 tests, 0 failures).
- [x] 5 study cases demonstrated end-to-end.
- [x] Rubric mapping document ready.
- [x] No unresolved blocker remains.

---

## Sprint 4 Additional Verification

- [x] Full build passes: `npm run build:web` + `npm run build:api`
- [x] Lint passes: 0 errors, 0 warnings
- [x] Typecheck passes: api/web/shared
- [x] OpenAPI docs complete and accessible (`/docs`)
- [x] DSS checklist 27 items evidenced
- [x] Anonymity architecture hardened (`identity_links` plaintext removed)
- [x] CI workflow updated with ZAP, k6, Lighthouse jobs
