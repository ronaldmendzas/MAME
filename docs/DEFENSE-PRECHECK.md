# Defense Precheck (Final Class Runbook)

Use this file 30-60 minutes before class defense.
Mark every item as done and capture timestamp/evidence.

## A) Environment Ready
- [ ] API starts successfully (`npm run dev:api` or worker dev command).
- [ ] Frontend starts successfully (`npm run dev:web`).
- [ ] Database connection works.
- [ ] Required env vars are loaded (DB, encryption keys, Clerk values).
- [ ] One browser session for USER and another for ADMIN is available.

## B) Technical Sanity Tests
- [ ] Local auth routes:
  - `npm run test -- apps/api/__tests__/auth/auth-local-routes.test.ts`
- [ ] Password policy + hasher:
  - `npm run test -- apps/api/__tests__/auth/password-policy.test.ts apps/api/__tests__/auth/password-hasher.test.ts`
- [ ] Local login lockout:
  - `npm run test -- apps/api/__tests__/auth/authenticate-local-login.test.ts`
- [ ] MFA internals:
  - `npm run test -- apps/api/__tests__/auth/totp-service.test.ts apps/api/__tests__/auth/mfa-enrollment.test.ts`
- [ ] RBAC/admin routes:
  - `npm run test -- apps/api/__tests__/admin/admin-routes.test.ts apps/api/__tests__/auth/role-middleware.test.ts`

## C) 5 Required Study Cases (Live)
1. [ ] Strong password registration accepted.
2. [ ] Weak password registration rejected.
3. [ ] Failed login lockout after repeated failures.
4. [ ] MFA enrollment and verification (valid + invalid code).
5. [ ] Access denied on unauthorized route, allowed for authorized role.

Helper:
- [ ] `./scripts/demo-auth-local.ps1 -ApiBaseUrl http://localhost:8787`

## D) Rubric Mapping On-Screen
- [ ] Open and keep visible: `docs/DEFENSE-EVIDENCE-MATRIX.md`
- [ ] Open and keep visible: `docs/DEFENSE-CHECKLIST.md`
- [ ] Open and keep visible: `docs/AUTH-AUTHZ-FLOW.md`

## E) Ethics and Responsible Use
- [ ] Explicitly mention controlled-lab scope.
- [ ] Explicitly mention no unauthorized testing policy.
- [ ] Show privacy notice in sign-up path.

## F) Final Defense Talking Points (60 seconds each)
- [ ] Authentication vs authorization difference.
- [ ] CID triad mapping to implementation.
- [ ] Why least privilege is enforced in routes.
- [ ] Why append-only logs protect integrity.
- [ ] What is intentionally out of scope and why.

## G) Evidence Capture Log
- Date:
- Team presenter:
- API commit hash:
- Web commit hash:
- Test command screenshots saved at:
- Demo video timestamp notes:

## H) Exit Criteria Before Entering Class
- [ ] All critical tests green.
- [ ] 5 study cases demonstrated end-to-end.
- [ ] Rubric mapping document ready.
- [ ] No unresolved blocker remains.