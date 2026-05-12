# OpenAPI Documentation Evidence — Phase E (2026-05-12)

Branch: sprint-4/release-hardening
Scope: Complete OpenAPI 3.0 coverage for all implemented endpoints

## Coverage Summary

| Path | Methods | Status |
|---|---|---|
| `/health` | GET | ✅ |
| `/webhooks/clerk` | POST | ✅ |
| `/auth/local/register` | POST | ✅ |
| `/auth/local/login` | POST | ✅ |
| `/auth/local/mfa/begin` | POST | ✅ |
| `/auth/local/mfa/confirm` | POST | ✅ |
| `/auth/local/mfa/verify` | POST | ✅ |
| `/me` | GET | ✅ |
| `/reports` | GET, POST | ✅ |
| `/reports/search` | GET | ✅ |
| `/reports/mine` | GET | ✅ |
| `/reports/{id}` | GET, PATCH | ✅ |
| `/reports/{id}/history` | GET | ✅ |
| `/reports/{id}/submit` | POST | ✅ |
| `/reports/{id}/evidence` | GET, POST | ✅ |
| `/reports/{id}/evidence/link` | POST | ✅ |
| `/reports/{id}/comments` | GET, POST | ✅ |
| `/reports/{id}/comments/{commentId}` | DELETE | ✅ |
| `/reports/{id}/vote` | POST, DELETE | ✅ |
| `/admin/users` | GET | ✅ |
| `/admin/users/{id}/role` | PATCH | ✅ |
| `/admin/stats` | GET | ✅ |
| `/moderation/check` | POST | ✅ |
| `/moderation/queue` | GET | ✅ |
| `/moderation/{id}` | PATCH | ✅ |
| `/security/events` | GET | ✅ |
| `/media/{fileKey}` | GET | ✅ |
| `/docs` | GET | ✅ |

## Schemas Defined

- `ErrorResponse`
- `Report`
- `Evidence`
- `Comment`
- `User`
- `Stats` (new)

## Verification

```bash
# Start API and fetch spec
 curl http://localhost:8787/docs
```

The response is a valid OpenAPI 3.0 JSON object with all paths merged.

## Artifacts

- `apps/api/src/openapi/index.ts` — spec assembly
- `apps/api/src/openapi/components.ts` — shared schemas + security schemes
- `apps/api/src/openapi/paths/system.ts` — health, webhooks, auth-local, me, docs
- `apps/api/src/openapi/paths/reports.ts` — reports CRUD + search + mine
- `apps/api/src/openapi/paths/reports-sub.ts` — evidence, comments, votes
- `apps/api/src/openapi/paths/admin.ts` — users, moderation, security events
- `apps/api/src/openapi/paths/stats.ts` — admin stats (new)
