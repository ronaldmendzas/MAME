# Sprint 4 Closeout Playbook

This playbook defines the exact execution order to complete Sprint 4 and release v1.0.
It is aligned with:
- docs/SPRINTS.md
- docs/CODING-STANDARDS.md
- docs/ARCHITECTURE.md
- docs/SECURITY.md
- README.md

## 0) Working Rules (Do Not Skip)

1. Keep all work in branch `sprint-4/release-hardening`.
2. Use Conventional Commits only.
3. Keep commits atomic: one concern per commit.
4. Ensure each commit is buildable and testable.
5. Security changes require 2 reviewers in PR.
6. Do not violate hexagonal boundaries (`domain <- application <- infrastructure <- http`).
7. Do not log PII, tokens, or secrets.

## 1) Sprint 4 Definition of Done (Target)

Complete all launch criteria from Sprint 4:
1. OWASP ZAP: zero critical/high findings.
2. Peak load validated with acceptable degradation.
3. Lighthouse mobile >= 85.
4. DSS controls completed with evidence.
5. OpenAPI docs complete and accessible.
6. Beta full-flow evidence captured.
7. Sentry running without PII leakage.
8. Incident response plan documented.

## 2) Execution Order

Follow this order exactly to reduce rework.

### Phase A: Baseline and Evidence Folder

1. Create a release evidence folder structure:
   - docs/evidence/s4/security/
   - docs/evidence/s4/performance/
   - docs/evidence/s4/ux/
   - docs/evidence/s4/api/
   - docs/evidence/s4/release/
2. Capture current baseline:
   - current branch
   - current test status
   - current lighthouse score
   - current known issues
3. Open a tracking issue/checklist for S4 completion.

Suggested commit:
- `docs(s4): add sprint 4 evidence structure and baseline checklist`

### Phase B: Security Hardening

1. Run OWASP ZAP on staging target.
2. Classify findings by severity.
3. Fix all critical/high findings first.
4. Re-run ZAP until critical/high = 0.
5. Document medium/low findings and mitigation dates.
6. Verify security headers and CORS behavior across all APIs.
7. Verify no sensitive data in logs and Sentry events.

Suggested commit sequence:
1. `fix(security): resolve zap critical findings in api routes`
2. `fix(security): tighten headers and cors policy coverage`
3. `docs(security): add zap report and mitigation notes`

### Phase C: Performance and Capacity

1. Measure baseline performance and P95.
2. Apply code splitting and lazy loading where needed.
3. Ensure image optimization path is consistent.
4. Run k6 peak scenario and collect artifacts.
5. Tune hotspots and re-run until target is met.

Suggested commit sequence:
1. `perf(web): improve code splitting and lazy loading`
2. `perf(api): optimize hot paths impacting p95 latency`
3. `test(perf): add k6 scenario and captured results`

### Phase D: UX, Responsive, Accessibility

1. Validate key screens at 320/375/768/1024/1440.
2. Fix overflows and small touch targets.
3. Run Lighthouse mobile and keep evidence.
4. Run accessibility checks and fix critical/serious findings.

Suggested commit sequence:
1. `fix(web): resolve responsive issues for key breakpoints`
2. `fix(web): improve accessibility and touch target compliance`
3. `docs(ux): add lighthouse and accessibility evidence`

### Phase E: API Docs and Operations

1. Complete OpenAPI coverage for current endpoints.
2. Verify docs endpoint availability.
3. Finalize incident response procedures.
4. Confirm runbook completeness for launch day.

Suggested commit sequence:
1. `docs(api): complete openapi coverage for sprint 4 endpoints`
2. `docs(ops): finalize incident response runbook for release`

### Phase F: Final Validation and Release Readiness

1. Execute full critical test pack.
2. Execute end-to-end flow validation.
3. Confirm DoD checklist fully green.
4. Prepare release notes and merge plan.

Suggested commit sequence:
1. `test(release): validate sprint 4 critical suites and smoke tests`
2. `docs(release): add sprint 4 closeout report and release notes`

## 3) PR and Merge Policy

1. Open PR: `sprint-4/release-hardening -> develop`.
2. Keep PRs small when possible (split by phase if needed).
3. Link evidence in PR description.
4. Require:
   - green CI
   - reviewer approval (2 reviewers for security-related changes)
5. After develop is stable, plan release merge `develop -> main`.

## 4) Architecture Guardrails During S4

1. Keep route handlers thin.
2. Put business logic in application/domain layers.
3. Keep infra concerns in adapters.
4. Avoid introducing direct cross-layer shortcuts.
5. Keep file/function sizes within coding standards where feasible.

## 5) Fast Daily Checklist

1. Pull latest branch state.
2. Pick one atomic task.
3. Implement + test.
4. Commit with conventional format.
5. Record evidence artifact.
6. Update S4 checklist status.

## 6) Stop Conditions

Do not mark Sprint 4 complete if any of these are true:
1. OWASP critical/high findings remain.
2. Lighthouse mobile target is not met.
3. k6 peak target is not met.
4. OpenAPI docs are incomplete.
5. Incident response plan is missing or outdated.
6. Security evidence is incomplete.
