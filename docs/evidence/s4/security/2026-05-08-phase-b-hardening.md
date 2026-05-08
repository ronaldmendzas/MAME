# Security Hardening Evidence — Phase B (2026-05-08)

Scope: Sprint 4 Phase B — Security Hardening Cycle  
Branch: sprint-4/release-hardening

## Summary

Phase B security hardening completed on branch `sprint-4/release-hardening`.
Two atomic commits applied:

1. `fix(security): add missing param guard clauses to all api route handlers`
2. `fix(security): tighten cors policy and harden csp headers per dss spec`

---

## Finding 1 — Missing Input Validation Guards on Route Handlers

**Severity:** High (OWASP A03:2021 — Injection / input validation)  
**Status:** Fixed ✅

### Description

12 API route handlers were reading URL path parameters (`c.req.param(...)`) without an early-return guard for empty/undefined values. Under TypeScript strict mode, `c.req.param()` returns `string | undefined`. Without the guard, malformed request contexts could reach DB query logic with an undefined ID.

### Affected Handlers

| Handler | Param validated |
|---|---|
| `comment-create.ts` | `id` (report ID) |
| `comment-delete.ts` | `commentId` |
| `comment-list.ts` | `id` (report ID) |
| `evidence-link.ts` | `id` (report ID) |
| `evidence-list.ts` | `id` (report ID) |
| `evidence.ts` | `id` (report ID) |
| `moderation-action.ts` | `id` (report ID) |
| `report-detail.ts` | `id` (report ID) |
| `report-submit.ts` | `id` (report ID) |
| `reports.ts` (PATCH) | `id` (report ID) |
| `vote-add.ts` | `id` (report ID) |
| `vote-remove.ts` | `id` (report ID) |

### Fix Applied

Added guard clause at the top of each handler per Coding Standards §3.3 (Early Returns):

```C:\MAME\apps\api\src\http\routes\comment-create.ts#L1-3
const reportId = c.req.param('id')
if (!reportId) throw new ValidationError('Missing report ID')
```

Throws `ValidationError` (422 Unprocessable Entity) which the global error handler maps correctly.

---

## Finding 2 — CORS Wildcard Origin in Development Mode

**Severity:** Medium (OWASP A05:2021 — Security Misconfiguration)  
**Status:** Fixed ✅

### Description

The CORS middleware used `origin: '*'` (wildcard) when `ENVIRONMENT === 'development'`. SECURITY.md §4.3 and §4.1 explicitly state: "Strict — only MAME domain(s) allowed, no wildcard". A misconfigured environment variable could inadvertently expose wildcard CORS in staging or production.

### Fix Applied

Removed the `isDevelopment` branch entirely. The middleware now always uses a list-based origin function:
- If `ALLOWED_ORIGINS` env var is set: use that list (production)
- Otherwise: fall back to `DEV_ORIGINS` (localhost variants for local dev)

No wildcard is ever used.

---

## Finding 3 — Missing `Access-Control-Allow-Credentials` Header

**Severity:** Medium (OWASP A05:2021 — Security Misconfiguration)  
**Status:** Fixed ✅

### Description

SECURITY.md §4.3 states "Credentials mode enabled" for CORS. The middleware was missing `credentials: true`, meaning browser clients using `fetch` with `credentials: 'include'` would fail silently without receiving the `Access-Control-Allow-Credentials: true` header.

### Fix Applied

Added `credentials: true` to the Hono `cors()` call. Safe to combine with the list-based origin function (browsers enforce that credentials + wildcard is invalid — the wildcard removal in Finding 2 is a prerequisite).

---

## Finding 4 — Missing `X-XSS-Protection: 0` Header

**Severity:** Low (OWASP A05:2021 — Security Misconfiguration)  
**Status:** Fixed ✅

### Description

SECURITY.md §8 (Security Headers Reference) explicitly lists `X-XSS-Protection: 0`. The legacy XSS Auditor (present in older Chrome/Safari) can be exploited to suppress legitimate scripts or exfiltrate content via `X-XSS-Protection: 1; report=`. Setting the header to `0` disables the auditor in all browsers that still check it.

### Fix Applied

Added `xXssProtection: '0'` to the Hono `secureHeaders()` call.

---

## Finding 5 — CSP `connect-src` Missing `api.clerk.dev`

**Severity:** Medium (OWASP A05:2021 — Security Misconfiguration)  
**Status:** Fixed ✅

### Description

SECURITY.md §8 defines:
```
connect-src 'self' https://api.clerk.dev
```
The `connectSrc` directive only contained `'self'`. Browsers enforcing CSP would block Clerk authentication API calls from the API worker in environments where the browser enforces this header, potentially breaking auth flows.

### Fix Applied

Updated `contentSecurityPolicy.connectSrc` to `["'self'", 'https://api.clerk.dev']`.

---

## Test Evidence

All security-related test packs run and passed after hardening:

### Security middleware (updated)
- Command: `npx vitest run apps/api/__tests__/http/security.test.ts`
- Result: **14 tests passed** (including 5 new tests for new headers and credentials)

### Route param guard tests (new)
- Command: `npx vitest run apps/api/__tests__/http/route-param-guards.test.ts`
- Result: **10 tests passed** (9 report-ID guards + 1 comment-ID guard)

### Evidence route (updated)
- Command: `npx vitest run apps/api/__tests__/evidence/evidence-route.test.ts`
- Result: **4 tests passed** (including new missing-ID test)

### App-level security headers
- Command: `npx vitest run apps/api/__tests__/http/app.test.ts`
- Result: **12 tests passed**

### Auth middleware and JWT flow
- Command: `npx vitest run apps/api/__tests__/auth/`
- Result: **17 files, 82 tests passed**

### Security events and role-gated endpoints
- Command: `npx vitest run apps/api/__tests__/security/`
- Result: **2 files, 6 tests passed**

### Full workspace suite
- Command: `npx vitest run`
- Result: **68 test files, 421 tests passed — 0 failures**

---

## OWASP ZAP Status

- ZAP CLI not installed locally.
- Docker Hub pull remains pending (bandwidth constraint from previous session).
- **Recommendation:** Execute ZAP scan in CI/staging runner against deployed instance.
- All code-level security controls verified via unit/integration tests above.

---

## DSS Pre-Launch Checklist — Items Verified This Session

| # | Control | Status |
|---|---|---|
| 9 | CORS configured — only MAME domain(s), no wildcard | ✅ Fixed |
| 11 | Security headers active on ALL responses | ✅ Verified + X-XSS-Protection added |
| 13 | ALL user inputs sanitized — Zod + guard clauses on backend | ✅ Fixed (12 routes) |
| 16 | Zod validation on ALL write endpoints | ✅ Verified |

---

## Next Actions

1. Execute OWASP ZAP scan in CI/staging (blocker for launch criterion #1).
2. Continue Phase C (performance baseline) and Phase D (UX/accessibility).
3. Confirm `connect-src` for CDN media proxy domain once production domain is finalized.
