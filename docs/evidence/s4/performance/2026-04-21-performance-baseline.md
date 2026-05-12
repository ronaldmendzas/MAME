# Performance Baseline Evidence - 2026-04-21

Scope: Sprint 4 Phase C baseline validation.
Branch: sprint-4/release-hardening

## Tooling Availability

- k6 / Lighthouse CLI check:
  - Command: where k6 && where lighthouse
  - Result: not found in local environment.

## Executed Performance Test Packs

1. Repository-level load query tests

- Command:
  - npm run test -- apps/api/**tests**/performance/load-queries.test.ts apps/api/**tests**/performance/feed-search-perf.test.ts
- Result:
  - 2 files passed
  - 17 tests passed

## Coverage of Performance Contracts

- Feed pagination contract verified (cursor-based behavior and limits).
- Search repository contract verified (safe query path and pagination semantics).
- Repository timing assertions for feed/search test suite passed.

## Current Gaps to Close Sprint 4 Criteria

1. k6 peak simulation (275 concurrent users) not yet executed.
2. Lighthouse mobile score evidence not yet captured.
3. End-to-end metrics under simulated 4G pending.

## Next Actions

1. Install or run k6 via CI/staging runner and execute peak scenarios.
2. Generate Lighthouse mobile report for key pages.
3. Store artifacts in docs/evidence/s4/performance/ and docs/evidence/s4/ux/.
