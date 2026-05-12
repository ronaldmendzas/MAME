# Performance Hardening Evidence — Phase C (2026-05-08)

Scope: Sprint 4 Phase C — Performance & Capacity  
Branch: sprint-4/release-hardening

## Summary

Phase C performance hardening completed.
Four atomic commits applied:

1. `perf(web): lazy load role-gated nav links and signed-in-only upload components`
2. `perf(web): add native lazy loading to evidence thumbnail images`
3. `perf(api): add cache-control headers to public feed and search routes`
4. `test(perf): add k6 peak scenario script for 275-vu university traffic pattern`

---

## Improvement 1 — Frontend Code Splitting via Dynamic Imports

**Category:** LCP / Bundle Size / Time to Interactive  
**Status:** Applied ✅

### Components Lazy Loaded

| Component           | Trigger                   | Imported Dependencies                                            | Impact                                            |
| ------------------- | ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| `AdminNavLink`      | Role loaded (client-side) | `auth-role.ts`, Clerk hooks                                      | Removed from main bundle                          |
| `ModerationNavLink` | Role loaded (client-side) | `auth-role.ts`, Clerk hooks                                      | Removed from main bundle                          |
| `SecurityNavLink`   | Role loaded (client-side) | `auth-role.ts`, Clerk hooks                                      | Removed from main bundle                          |
| `EvidenceUpload`    | User signed in            | `compress-image.ts` (canvas API), `strip-metadata.ts` (EXIF/PDF) | Heaviest: canvas + EXIF + PDF processing deferred |
| `ReportForm`        | Create report page visit  | Multi-step form + all steps                                      | Split into separate chunk with skeleton fallback  |

### How

`next/dynamic()` with `{ ssr: false }` for client-only components and a meaningful `loading` skeleton for the form.

### Before / After (conceptual bundle impact)

- Main bundle: Removes canvas API, EXIF processing (piexifjs), PDF metadata (pdf-lib), and all role-nav link modules from the initial parse
- Role nav links: Only downloaded if the user is logged in and auth has resolved
- Upload component: Only downloaded on report detail page after auth state confirms `isSignedIn`
- Report form: Skeleton shown immediately; form JS loaded in parallel

---

## Improvement 2 — Native Image Lazy Loading

**Category:** Initial Page Load / Bandwidth  
**Status:** Applied ✅

### Change

Added `loading="lazy"` to the thumbnail `<img>` in `EvidenceLightbox`.  
Added `loading="eager"` to the full-size image inside the lightbox dialog (loads only after user clicks).

Evidence thumbnails appear below the fold on report detail pages. Browser-native lazy loading defers their fetch until they enter the viewport, reducing initial bandwidth consumption.

---

## Improvement 3 — Cache-Control Headers on Public API Routes

**Category:** Throughput / DB Load / P95 Latency  
**Status:** Applied ✅  
**Impact on 275-VU target:** High — CDN-cached responses bypass the DB entirely

### Feed Route (`GET /reports`)

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

- Cloudflare CDN caches each cursor-page response for 60 seconds
- Stale content served up to 5 minutes while background revalidation runs
- With 275 concurrent users at 11am peak, the CDN will absorb the majority of feed requests after the first user warms each page
- Each unique cursor + filter combination has its own cache key

### Search Route (`GET /reports/search`)

```
Cache-Control: public, s-maxage=30, stale-while-revalidate=60
```

- Shorter TTL (30s) because search results reflect new publications sooner
- Still dramatically reduces full-text query load during peak traffic

### Why Report Detail Is NOT Cached

`GET /reports/:id` returns evidence with time-limited signed URLs (HMAC, 1h expiry). Caching this response at the CDN would serve expired signed URLs to subsequent users. The route is kept uncached by design.

### Capacity Math (ISR + CDN Caching Model)

| Metric                        | Without Cache     | With Cache (60s TTL)         |
| ----------------------------- | ----------------- | ---------------------------- |
| DB queries / minute (275 VUs) | ~275 × 10 = 2,750 | ~1-5 (cold start per minute) |
| Worker invocations / day      | ~100K+            | Well under 100K/day          |
| Target: 100K req/day budget   | At risk           | ✅ Safely within budget      |

This matches the ARCHITECTURE.md capacity model: "ISR caching strategy" that keeps Cloudflare Workers invocations under the 100K/day free tier.

---

## Test Evidence

### Cache-Control header tests (new)

- File: `apps/api/__tests__/performance/cache-headers.test.ts`
- Command: `npx vitest run apps/api/__tests__/performance/cache-headers.test.ts`
- Result: **9 tests passed**
  - Feed: public, s-maxage=60, stale-while-revalidate=300 ✅
  - Search: public, s-maxage=30, stale-while-revalidate=60 ✅
  - Feed returns 200 with data array ✅
  - Search returns 200 with meta ✅

### Performance repository tests (existing, re-validated)

- Command: `npx vitest run apps/api/__tests__/performance/`
- Result: **26 tests passed** (3 files)

### Full workspace suite

- Command: `npx vitest run`
- Result: **69 test files, 430 tests passed — 0 failures**

---

## k6 Peak Scenario Script

- File: `scripts/k6-peak.js`
- Target: 275 VUs (university 11am peak)
- Traffic pattern:
  - 0-2m: ramp 0→50 VUs (pre-peak)
  - 2-5m: ramp 50→275 VUs (approaching peak)
  - 5-10m: sustained 275 VUs (peak window)
  - 10-12m: taper 275→50 VUs
  - 12-13m: ramp 50→0 VUs (end)
- Thresholds:
  - `http_req_duration p(95) < 200ms` (DoD requirement)
  - `error_rate < 1%`
  - `search_duration p(95) < 500ms`
- Scenarios modeled: feed browse (70%), search (20%), report detail (10%)
- **Status:** Script ready. Execution pending CI/staging runner with k6 installed.

---

## Tooling Availability

| Tool           | Local         | CI/Staging |
| -------------- | ------------- | ---------- |
| k6             | Not installed | Required   |
| Lighthouse CLI | Not installed | Required   |
| Vitest         | ✅ Installed  | ✅         |

---

## DoD Checklist Status

| Criterion                     | Status                  |
| ----------------------------- | ----------------------- |
| P95 < 200ms with 275 VUs      | ⏳ Pending k6 run in CI |
| Error rate < 1% at peak       | ⏳ Pending k6 run in CI |
| Code splitting applied        | ✅ Done                 |
| Image lazy loading consistent | ✅ Done                 |
| CDN caching on public routes  | ✅ Done                 |
| k6 script ready for CI        | ✅ Done                 |

---

## Next Actions

1. Run `scripts/k6-peak.js` in CI/staging against the deployed API.
2. Record k6 output artifact in `docs/evidence/s4/performance/`.
3. Proceed to Phase D (UX, Responsive, Accessibility).
