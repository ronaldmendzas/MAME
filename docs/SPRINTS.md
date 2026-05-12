# Sprint Plan & Version Roadmap

> **MAME v2.0** — Complete Sprint Breakdown, User Stories, Technical Tasks & Delivery Plan
>
> _Synthesized from: `MAME_Sprints_Versiones.pdf` (Sprint v1.0, 16 pages) and `MAME_Sprints_v2.pdf` (Sprint v2.0, 8 pages)_

---

## 1. Project Metrics

| Metric                       | Value                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| **Total Duration**           | 11 weeks                                                                           |
| **Team Size**                | 15+ university students                                                            |
| **Methodology**              | Scrum (adapted for academic context)                                               |
| **Project Management**       | GitHub Projects (Kanban board)                                                     |
| **Sync Meetings**            | Weekly, 30 minutes maximum                                                         |
| **Sprint Velocity**          | 40-60 story points per sprint                                                      |
| **Definition of Done (DoD)** | Feature with tests + PR approved by 2 reviewers + deployed to staging + documented |
| **Estimation**               | Fibonacci story points (1, 2, 3, 5, 8, 13)                                         |

---

## 2. Sprint Overview

| Sprint | Name                      | Duration    | Focus                             | Deliverable          |
| ------ | ------------------------- | ----------- | --------------------------------- | -------------------- |
| **S1** | Foundation & Security     | Weeks 1-3   | Auth, anonymity, infrastructure   | v0.1 Alpha Técnico   |
| **S2** | Publications & Evidence   | Weeks 4-6   | Reports, files, AI filter, search | v0.2 Alpha Funcional |
| **S3** | Moderation & Community    | Weeks 7-9   | Human review, comments, votes     | v1.0 Beta Cerrada    |
| **S4** | Polish, Security & Launch | Weeks 10-11 | UX, performance, pen testing      | v1.0 Release Oficial |

---

## 3. Sprint 1 — Foundation & Security (Weeks 1-3)

### Objective

> "A developer can register, log in, and the system can **cryptographically demonstrate** it cannot link their email to their future actions."

### User Stories

| ID         | Story                                                                                                                                                                                                  | Points | Acceptance Criteria                                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-001** | As a user, I can create an account with my email so I have verified access. Email is NEVER stored in plaintext in our DB — only as HMAC-SHA256 hash. Clerk.dev handles auth UI and email verification. | 6      | Registration via Clerk works. On `user.created` webhook, backend stores `email_hash` only. DB contains only HMAC hash, no plaintext email.                                                                                                                  |
| **US-002** | As a user, I can log in securely with a session that expires in 1 hour and get locked out after 5 failed attempts.                                                                                     | 5      | JWT RS256 with 1h expiry works. Refresh token 7d with rotation. 5 failed attempts → 15min block.                                                                                                                                                            |
| **US-003** | As a user, my identity is NEVER linked to my publications. Verified with cryptographic test.                                                                                                           | 8      | Anonymous token (UUID v4) generated on registration. `identity_links` table stores only HMAC proof. **Cryptographic test:** given full DB dump, demonstrate inability to link email → token without both ENCRYPTION_MASTER_KEY and ENCRYPTION_RELATION_KEY. |
| **US-004** | As an admin, I can configure user roles (mod, admin) and these are verified on the backend.                                                                                                            | 5      | Clerk.dev roles configured. Backend middleware verifies role on every protected endpoint. Frontend checks prevent unauthorized UI access.                                                                                                                   |
| **US-005** | As a user, I can log out and my JWT + refresh token are immediately invalidated server-side.                                                                                                           | 3      | After logout, using old JWT returns 401. Using old refresh token returns 401. No session trace on server.                                                                                                                                                   |

### Technical Tasks

| Task                                                                    | Owner    | Points | Description                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Setup monorepo with `apps/web` + `apps/api`                             | DevOps   | 3      | Turborepo or npm workspaces. Shared TypeScript config. ESLint + Prettier config.                                                                                                                                                                                                                                               |
| Docker Compose for local development                                    | DevOps   | 3      | PostgreSQL, Workers dev mode, all services. `.env.example` with placeholder values.                                                                                                                                                                                                                                            |
| DB schema: `users`, `anonymous_profiles`, `identity_links` with Drizzle | Data     | 5      | Drizzle ORM schema definitions. `users.clerk_id` UNIQUE (Clerk webhook sync), `users.email_hash` UNIQUE, `anonymous_profiles.token_id` PK, `identity_links.relation_proof` TEXT. No password column (Clerk handles auth).                                                                                                      |
| Drizzle versioned migrations                                            | Data     | 3      | Migration system configured. Schema changes tracked. Push to Neon branches.                                                                                                                                                                                                                                                    |
| Clerk.dev integration with webhooks                                     | Backend  | 5      | User creation webhook → backend receives email → computes HMAC hash → generates anonymous token in our DB. JWT verification middleware. Role sync. Clerk handles all auth UI, passwords, and email verification.                                                                                                               |
| Anonymous token generation HMAC-SHA256 + UUID                           | Backend  | 8      | Core anonymity implementation. `email_hash = HMAC-SHA256(email, ENCRYPTION_MASTER_KEY)`. `token = UUID v4`. `relation_proof = HMAC-SHA256(email_hash + token_id, ENCRYPTION_RELATION_KEY)`. Keys from Cloudflare Secrets.                                                                                                      |
| Auth middleware: JWT RS256 verification                                 | Backend  | 5      | Middleware that verifies JWT on every protected route. Uses Clerk's public RSA key. Extracts user role and token.                                                                                                                                                                                                              |
| Cloudflare Workers setup: Hono.js + wrangler                            | DevOps   | 5      | `wrangler.toml` configured. Hono.js routes. KV bindings. Secrets configured.                                                                                                                                                                                                                                                   |
| Environment variables + Cloudflare Secrets                              | DevOps   | 3      | `ENCRYPTION_MASTER_KEY`, `ENCRYPTION_RELATION_KEY` in Cloudflare Secrets. DB URLs in env. `.env.example` versioned.                                                                                                                                                                                                            |
| Sentry setup (no personal data in logs)                                 | DevOps   | 2      | Sentry SDK initialized in frontend + backend. `beforeSend` hook strips emails/tokens from error events.                                                                                                                                                                                                                        |
| Security headers middleware: CSP, HSTS, X-Frame-Options                 | Backend  | 3      | Hono middleware on ALL routes. `Content-Security-Policy: script-src 'self'`. `Strict-Transport-Security: max-age=31536000; includeSubDomains`. `X-Content-Type-Options: nosniff`. `X-Frame-Options: DENY`. `Referrer-Policy: strict-origin-when-cross-origin`. `Permissions-Policy: camera=(), microphone=(), geolocation=()`. |
| CORS strict middleware                                                  | Backend  | 2      | Hono `cors()` middleware. Origin whitelist: ONLY MAME frontend domain(s). NO wildcard `*`. Credentials enabled. Preflight cache 1h. Applied before all route handlers.                                                                                                                                                         |
| DOMPurify + input sanitization hardening                                | Frontend | 3      | Install `dompurify` + `@types/dompurify` in `apps/web`. Create `sanitize()` utility. Apply to ALL components rendering user-generated content (report body, titles, comments). Zod schemas with `.trim()` + `.max()` constraints on backend.                                                                                   |
| Auth unit tests: >80% coverage                                          | QA       | 5      | Tests for: registration flow, login flow, token generation, JWT verification, rate limiting, logout. Vitest.                                                                                                                                                                                                                   |

### Sprint 1 Definition of Done

| #   | Criterion                                                                                         |
| --- | ------------------------------------------------------------------------------------------------- |
| 1   | `users` table contains ONLY `email_hash` — grep DB dump for `@` returns zero results              |
| 2   | Anonymous token has NO direct foreign key to `users` table                                        |
| 3   | JWT signed with RS256 (verify with `jwt.io` that algorithm is RS256)                              |
| 4   | Rate limiting active: 5 failed logins → 15min block (automated test)                              |
| 5   | Security headers present on ALL responses (CSP, HSTS, X-Frame-Options, nosniff — automated check) |
| 6   | CORS configured with strict origin whitelist — no wildcard `*` (automated test)                   |
| 7   | ENCRYPTION_MASTER_KEY and ENCRYPTION_RELATION_KEY in Cloudflare Secrets, not in code or .env      |
| 8   | DOMPurify applied to ALL user-generated content rendering (report body, titles, comments)         |
| 9   | ALL inputs sanitized: Zod `.trim()` + `.max()` on backend, DOMPurify on frontend                  |
| 10  | Unit tests >80% coverage on auth module                                                           |
| 11  | CI pipeline runs on every PR, blocks merge on failure                                             |
| 12  | Docker Compose `up` works for all team members                                                    |

### Delivers: **v0.1 Alpha Técnico**

- Internal use only (development team)
- Auth system functional
- Infrastructure proven
- Security architecture validated

---

## 4. Sprint 2 — Publications & Evidence (Weeks 4-6)

### Objective

> "An authenticated user can create a report with evidence and the system automatically filters illegal content — **rejected files never reach Cloudinary storage.**"

### User Stories

| ID         | Story                                                                                                                                                                                                                                        | Points | Acceptance Criteria                                                                                                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **US-006** | As a user, I can create an anonymous report with title, description, category, and mandatory evidence.                                                                                                                                       | 8      | Form validates all fields. Backend rejects if no evidence attached. Report stored with `token_id` only (no user reference).                                                                                                                                                          |
| **US-007** | As a user, I can attach evidence files (images, PDFs, videos) or paste an external video link (YouTube/Drive), and the system strips ALL metadata **client-side in the browser** before upload. Server rejects files with residual metadata. | 8      | Upload JPG with EXIF → client-side piexifjs strips it → upload → server validates zero EXIF. Server rejects file with residual EXIF (422). Same for PDF author info via pdf-lib in browser. Files renamed to UUID. External video links stored as `evidence.type = 'external_link'`. |
| **US-008** | As the system, illegal content (CSAM, drugs, weapons) is automatically blocked — **rejected files NEVER uploaded to Cloudinary.** Report record marked REJECTED for audit trail.                                                             | 10     | Test with known-bad text → rejected. Test with NSFW image → rejected. Verify rejected file NOT in Cloudinary. Report record exists in DB with status `REJECTED`. Forensic log entry created. If suspected CSAM detected, mandatory NCMEC CyberTipline report triggered.              |
| **US-009** | As a visitor, I can see a feed of approved publications with category/date/faculty filters.                                                                                                                                                  | 5      | Feed loads in <2s. Cursor-based pagination works. Filters by category, faculty, date range. Only `Published` status reports visible.                                                                                                                                                 |
| **US-010** | As a user, I can search reports by keywords and get relevant results in <500ms.                                                                                                                                                              | 5      | GIN index on `search_vector`. Search ranks by relevance. Response time <500ms with 10K+ records.                                                                                                                                                                                     |
| **US-011** | As a user, I can view the complete status history of my report.                                                                                                                                                                              | 3      | Status timeline shows all state transitions with relative timestamps.                                                                                                                                                                                                                |

### Technical Tasks

| Task                                                                    | Owner    | Points | Description                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /reports` with Zod validation                                     | Backend  | 5      | Validates title (10-200 chars), body (100-5000), category (enum), faculty (string), evidence (min 1 file). Maps to anonymous `token_id`.                                                                                                                                                                                 |
| `GET /reports` cursor-based pagination                                  | Backend  | 3      | Returns published reports with cursor. Default 20/page. Supports filter params: `category`, `faculty`, `status`, `date_from`, `date_to`.                                                                                                                                                                                 |
| `GET /reports/:id` with permissions                                     | Backend  | 2      | Public if `Published`. Author can see all statuses. Moderator can see `Under Review`. Includes evidence URLs (signed) and comment count.                                                                                                                                                                                 |
| Upload to Cloudinary: multipart, magic number verification, UUID rename | Backend  | 8      | Multipart upload handler. Verify file type by magic bytes (not extension). **Reject files >5MB (post client-compression).** Reject files with residual EXIF metadata (422). Rename to UUID v4. Cloudinary signed upload. Return CDN-proxied signed URL.                                                                  |
| Client-side media processing library                                    | Frontend | 8      | **piexifjs** for EXIF stripping. **Canvas API** for WebP compression (≤200KB). **MediaRecorder** for video (≤10sec/500KB) and audio (≤60sec/300KB). **pdf-lib** for PDF metadata strip. External video link input (YouTube/Drive). All processing happens in browser before upload — **0 Cloudinary transform credits.** |
| Cloudflare CDN media proxy Worker                                       | Backend  | 5      | Worker proxies Cloudinary URLs through Cloudflare Cache API (24h TTL). First access hits Cloudinary (bandwidth credit). Repeat views served from Cloudflare edge (FREE). Reduces Cloudinary bandwidth from ~240 to ~4 credits/month.                                                                                     |
| Metadata stripping: client-side primary + server validation             | Backend  | 5      | **Images:** piexifjs strips EXIF in browser. **PDFs:** pdf-lib strips metadata in browser. **Server validates** no metadata remains (rejects with 422 if detected). Cloudinary `strip_profile` is **fallback only** (saves transform credits). Sharp/ffmpeg impossible in Workers (V8 isolates).                         |
| Workers AI text classifier (Llama Guard 3)                              | Backend  | 8      | `@cf/meta/llama-guard-3-8b`. Purpose-built safety classifier for: CSAM, drugs, weapons, grooming, trafficking, violence incitement. Confidence threshold tuning. Fallback to human-only moderation if accuracy < 90%.                                                                                                    |
| Workers AI image classifier + pHash                                     | Backend  | 8      | `@cf/meta/llama-3.2-11b-vision-instruct` for NSFW/violence. Perceptual hashing for known-bad image detection. Combined pass/fail decision. Mandatory NCMEC CyberTipline reporting process for suspected CSAM.                                                                                                            |
| Cloudinary signed URLs with configurable expiration                     | Backend  | 3      | Generate Cloudinary signed URLs for evidence access with time-limited authentication tokens. Regenerate on each request. Never permanent public URLs.                                                                                                                                                                    |
| Full-text search: GIN index + ranking                                   | Backend  | 5      | `search_vector TSVECTOR` column. Trigger to auto-update on INSERT/UPDATE. `ts_rank` for relevance ordering. Combined with recency.                                                                                                                                                                                       |
| Report states table with transition history                             | Data     | 3      | `report_status_history` table or embedded JSONB. Allowed transitions defined in code. Immutable history.                                                                                                                                                                                                                 |
| Report creation form (frontend) with preview                            | Frontend | 8      | Multi-step form. File upload with preview (images, PDFs). Category selector. Faculty field. Live character count. Drag & drop.                                                                                                                                                                                           |
| Feed component with infinite scroll + filters                           | Frontend | 5      | Intersection Observer for infinite scroll. Filter sidebar. Category badges. Mobile-responsive layout. Skeleton loading.                                                                                                                                                                                                  |
| Upload + moderation pipeline tests                                      | QA       | 8      | E2E tests: upload clean content → stored in Cloudinary + DB. Upload NSFW → rejected, Cloudinary folder empty. Upload PDF with metadata → metadata stripped.                                                                                                                                                              |

### Sprint 2 Definition of Done

| #   | Criterion                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Cannot submit report without evidence (frontend AND backend block)                                                                                     |
| 2   | Evidence metadata stripped **client-side** (piexifjs/pdf-lib in browser). Server rejects files with residual EXIF/metadata (422 error, automated test) |
| 3   | Text containing drug sale keywords is auto-rejected (automated test)                                                                                   |
| 4   | NSFW image is auto-rejected and NOT in Cloudinary (automated test)                                                                                     |
| 5   | Feed loads in <2 seconds on 4G simulation                                                                                                              |
| 6   | Search returns results in <500ms with 10K+ records (load test)                                                                                         |
| 7   | All evidence delivered via **Cloudflare CDN proxy** (Worker caches Cloudinary signed URLs at edge). No direct Cloudinary access from browser.          |
| 8   | Moderation pipeline integration tests at 100% pass rate                                                                                                |

### Delivers: **v0.2 Alpha Funcional**

- Internal beta testers (team of 15)
- Full report creation and viewing workflow
- AI content filtering active
- Search functional

---

## 5. Sprint 3 — Moderation & Community (Weeks 7-9)

### Objective

> "Full end-to-end flow: report created → auto filter → human review → publication → community interaction."

### User Stories

| ID         | Story                                                                                                                                                             | Points | Acceptance Criteria                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **US-012** | As a moderator, I have a dedicated panel showing the review queue where I can approve, reject (with reason), or request more info.                                | 8      | Queue ordered by date. Approve/reject/request info actions. Mandatory reason for rejection. All actions logged in audit trail.      |
| **US-013** | As the system, moderators cannot see or moderate reports from their own faculty.                                                                                  | 5      | System detects moderator's faculty vs report's faculty. On match: report hidden from that moderator, auto-reassigned.               |
| **US-014** | As a user, I can comment anonymously on published reports. Comments pass through the same AI filter.                                                              | 5      | Comment form on report page. Max 1000 chars. 2-level nesting. Workers AI filter on comment content. Same anonymous token reference. |
| **US-015** | As a user, I can join a report as a collaborative supporter ("me too") with my own account and optional evidence.                                                 | 5      | `POST /reports/:id/support`. Optional description + evidence. Public supporter count visible. Individual identities NOT revealed.   |
| **US-016** | As a user, I can anonymously vote on reports. 1 vote per user per report.                                                                                         | 3      | Vote button on report. Counter updates. Second vote attempt → error. `UNIQUE(report_id, token_id)` enforced in DB.                  |
| **US-017** | As a user, I can flag (report) a published post with a category (false report, inappropriate, exposed data, harassment). Accumulated flags trigger urgent review. | 3      | Flag button on report. Category selector. Threshold triggers re-review. User can report once per post.                              |
| **US-018** | As a user, I receive in-app notifications for state changes, collaborator evidence, and moderator responses. Delay < 5 minutes.                                   | 5      | Notification bell in UI. Unread count badge. Notification list with relative timestamps. No email (maintaining decoupling).         |

### Technical Tasks

| Task                                                                             | Owner    | Points | Description                                                                                                                                                                            |
| -------------------------------------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moderation panel UI                                                              | Frontend | 8      | Queue view with report preview. Action buttons (approve/reject/request info/escalate). Mandatory reason textarea for rejections. Evidence preview. Report statistics.                  |
| Moderation endpoints: `PATCH /reports/:id/moderate` with role validation + audit | Backend  | 5      | Verify JWT has moderator role. Verify moderator's faculty ≠ report's faculty. Log action to `moderation_log`. Update report status. Notify reporter.                                   |
| Anti-faculty-conflict detection + auto-reassignment                              | Backend  | 5      | Compare `moderator.faculty` with `report.faculty`. On conflict: hide report from queue, reassign to next available moderator. Log reassignment.                                        |
| Comments CRUD with AI auto-filter                                                | Backend  | 5      | `POST /comments`, `GET /comments?report_id=X`, `DELETE /comments/:id` (author only). Workers AI filter before storage. 2-level nesting via `parent_id`.                                |
| Voting system: 1 vote/user, transactional counter                                | Backend  | 3      | `POST /reports/:id/vote`. `UNIQUE(report_id, token_id)` constraint. Increment `reports.votes` **in same transaction** as `votes` table INSERT (decrement on DELETE). Return new count. |
| Collaborative reports: `POST /reports/:id/support`                               | Backend  | 5      | Accept description + optional evidence. Same metadata stripping pipeline. Public counter increment. Individual supporter tokens not exposed.                                           |
| Citizen reports: `POST /reports/:id/flag`                                        | Backend  | 3      | Accept category + optional description. Count flags per report. Threshold (configurable) triggers status change to `Under Review`.                                                     |
| In-app notifications table + polling                                             | Backend  | 5      | `notifications` table. Insert on state change, new support, moderator action. `GET /notifications` endpoint with pagination. Mark as read. No personal data in payload.                |
| Publication delay: Cloudflare Queues 1-6h random                                 | Backend  | 3      | On moderator approval: `queue.send(reportId, { delaySeconds: random(3600, 21600) })`. Queue consumer sets status to `Published`. Notifies reporter.                                    |
| Comments component (frontend)                                                    | Frontend | 5      | Nested comment tree (2 levels). Reply button. Character counter. Loading states. Anonymous commenter display.                                                                          |
| Enhanced feed with new filters                                                   | Frontend | 5      | Filter by: most voted, most supported, most recent, my reports. Category and faculty filters persist in URL params.                                                                    |
| Full flow integration tests                                                      | QA       | 8      | E2E: create report → AI filter pass → enters moderation queue → moderator approves → delay → published → comment → vote → support → flag. All assertions.                              |

### Sprint 3 Definition of Done

| #   | Criterion                                                                           |
| --- | ----------------------------------------------------------------------------------- |
| 1   | Full end-to-end flow works: create → filter → moderate → delay → publish → interact |
| 2   | Moderator CANNOT see reports from their own faculty (automated test)                |
| 3   | Every moderation action has audit trail entry with timestamp and moderator token    |
| 4   | Comments auto-filtered before display                                               |
| 5   | Publication delay between 1-6 hours active and verified                             |
| 6   | Moderator can process 50 reports/hour without friction                              |
| 7   | Notifications arrive within 5 minutes of triggering event                           |
| 8   | Full flow integration tests at 100% pass rate                                       |

### Delivers: **v1.0 Beta Cerrada (Closed Beta)**

- First 100-200 real users
- Full anonymous reporting workflow
- Community features active
- Moderation pipeline complete

---

## 6. Sprint 4 — Polish, Security & Launch (Weeks 10-11)

### Objective

> "MAME can receive the first 500 real users with confidence in security, performance, and stability."

### User Stories

| ID         | Story                                                                                                            | Points | Acceptance Criteria                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US-019** | As a new user, I understand what MAME is and how to use it without a tutorial. >80% complete registration alone. | 5      | Landing page with clear value proposition. FAQ section. Onboarding flow for first-time users. Usability test: 8/10 new users complete registration without help. |
| **US-020** | As a mobile user, I have a perfect experience on devices 320px and wider. Lighthouse Mobile ≥ 85.                | 8      | All pages responsive 320-1440px. Touch targets ≥ 44x44px. No horizontal scroll on mobile. Lighthouse Mobile Performance ≥ 85.                                    |
| **US-021** | As an admin, I can see anonymized statistics: reports by category/faculty/month, active users, moderation times. | 5      | Dashboard with Chart.js graphs. No personal data displayed. Filter by date range, category, faculty. Export to CSV.                                              |
| **US-022** | As a user on 4G, the page loads fast. Core Web Vitals: LCP < 2.5s.                                               | 5      | Lazy loading for images. Code splitting. `next/image` optimization. Skeleton loading states. LCP < 2.5s on 4G simulation.                                        |

### Technical Tasks

| Task                                                                 | Owner      | Points | Description                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OWASP ZAP automated security audit + fix critical/high               | Security   | 8      | Run OWASP ZAP against staging. Fix ALL critical and high findings. Document remaining medium/low with mitigation timeline.                                                                                                                                                                  |
| DSS checklist: 27 items with evidence                                | Security   | 5      | Complete the 27-item security checklist (see SECURITY.md). Each item must have screenshot/log evidence of compliance.                                                                                                                                                                       |
| Performance optimization: lazy loading, code splitting, `next/image` | Frontend   | 5      | Audit bundle size. Code split heavy components. Lazy load below-fold content. Use `next/image` for all images. Implement `next/font`.                                                                                                                                                       |
| Responsive design: complete 320-1440px                               | Frontend   | 8      | Test all pages at 320px, 375px, 768px, 1024px, 1440px. Fix all breakpoint issues. Touch targets ≥ 44x44px. No overflow.                                                                                                                                                                     |
| Admin statistics dashboard (Chart.js)                                | Full-Stack | 5      | Reports per category (bar chart). Reports per month (line chart). Reports per faculty (pie chart). Average moderation time. Active tokens count.                                                                                                                                            |
| Landing page + FAQ + onboarding flow                                 | Frontend   | 5      | Hero section explaining MAME. How it works (3-step visual). FAQ (collapsible). First-time user onboarding modal/tour.                                                                                                                                                                       |
| k6 load tests: 275 concurrent users (peak simulation)                | QA         | 8      | k6 scripts simulating university traffic pattern: 275 concurrent at 11am peak, tapering to ~30 overnight. Scenarios: browse feed (ISR cached), search, create report, comment, vote. Verify P95 < 200ms. Error rate < 1%. Verify function invocations stay under 100K/day with ISR caching. |
| Accessibility tests: axe-core, WCAG 2.1 AA                           | QA         | 3      | Run axe-core on all pages. Fix all critical/serious issues. Color contrast ratios pass. Screen reader navigation works. Keyboard navigation complete.                                                                                                                                       |
| API documentation: Swagger/OpenAPI 3.0                               | Backend    | 3      | All endpoints documented. Request/response schemas. Authentication requirements. Example values. Available at `/api/docs`.                                                                                                                                                                  |
| Incident response plan (documented)                                  | DevOps     | 3      | Written P0-P3 response procedures. Contact list. Escalation paths. Communication templates. Shared with all team members.                                                                                                                                                                   |
| Final production deploy                                              | DevOps     | 3      | Deploy to production (**Cloudflare Pages** + Workers). Verify all environment variables. CDN media proxy Worker deployed. Health check passing. Monitor Sentry for 24h.                                                                                                                     |
| Launch announcement                                                  | All        | 2      | Announcement content prepared. Social media accounts ready. Landing page live. Beta feedback incorporated.                                                                                                                                                                                  |

### Launch Criteria (Project Definition of Done)

| #   | Criterion                                                                           | How to Verify              |
| --- | ----------------------------------------------------------------------------------- | -------------------------- |
| 1   | OWASP ZAP scan: zero critical, zero high vulnerabilities                            | ZAP report screenshots     |
| 2   | ~275 concurrent users at peak with no >20% degradation in response time (ISR + CDN) | k6 load test results       |
| 3   | Lighthouse score ≥ 85 on mobile                                                     | Lighthouse report          |
| 4   | 27 DSS security controls completed with evidence                                    | Checklist with screenshots |
| 5   | Swagger/OpenAPI documentation complete for all endpoints                            | `/api/docs` accessible     |
| 6   | 5+ beta users completed full flow (register → report → interact)                    | User feedback forms        |
| 7   | Sentry active and capturing errors (without personal data)                          | Sentry dashboard           |
| 8   | Incident response plan documented and communicated                                  | Document in repo           |

### Delivers: **v1.0 Release Oficial**

- Public general access
- Full feature set
- Security validated
- Performance validated
- Documentation complete

---

## 7. Version Plan

| Version                  | Sprint | Audience                 | Key Features                                      |
| ------------------------ | ------ | ------------------------ | ------------------------------------------------- |
| **v0.1** Alpha Técnico   | S1     | Dev team only            | Auth, anonymity, infrastructure                   |
| **v0.2** Alpha Funcional | S2     | Team beta testers (15)   | Reports, evidence, AI filter, search              |
| **v1.0** Beta Cerrada    | S3     | First 100-200 real users | Full flow: create → moderate → publish → interact |
| **v1.0** Release Oficial | S4     | General public           | Polished, secure, performant                      |

---

## 8. Post-v1.0 Roadmap

| Version                      | Timeline                | Focus                                                                                                                    |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **v1.1** Multi-University    | 2-3 months post-launch  | Multi-tenant architecture, per-university data isolation, configurable email domains per tenant                          |
| **v1.2** Mobile App          | 4-6 months post-launch  | React Native mobile application (iOS + Android), push notifications                                                      |
| **v2.0** Investigative Tools | 6-12 months post-launch | Collaboration tools for investigative journalists and pro-bono lawyers, secure communication channels                    |
| **v2.1** MAME Verify         | 12+ months post-launch  | Voluntary student verification system (proves you're a student without revealing your name), credential-based reputation |

---

## 9. Sprint Ceremonies

| Ceremony                 | Frequency            | Duration       | Purpose                                              |
| ------------------------ | -------------------- | -------------- | ---------------------------------------------------- |
| **Sprint Planning**      | Start of each sprint | 1 hour         | Select user stories, break into tasks, assign owners |
| **Daily Standup**        | Weekly (adapted)     | 30 minutes max | What I did, what I'll do, blockers                   |
| **Sprint Review**        | End of each sprint   | 45 minutes     | Demo features to stakeholders, gather feedback       |
| **Sprint Retrospective** | End of each sprint   | 30 minutes     | What went well, what to improve, action items        |

---

## 10. Risk Mitigation per Sprint

| Sprint | Key Risk                                    | Mitigation                                                                                                                                |
| ------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| S1     | Anonymity architecture too complex for team | Pair programming on crypto module. Architecture review by 2 senior members. Clerk handles auth UI complexity.                             |
| S2     | Workers AI accuracy insufficient            | Llama Guard 3 purpose-built for safety classification (better than general LLMs). Fallback to human-only moderation if AI accuracy < 90%. |
| S3     | Moderation queue becomes bottleneck         | Batch processing UI. 50 reports/hour target. Auto-escalation after 48h unreviewed.                                                        |
| S4     | Security audit reveals critical flaws       | Budget 8 story points for fixes. Scope reduction on non-critical features if needed.                                                      |

---

## 11. MVP Scope Realism

> **Honest assessment for 15+ students over 11 weeks:**

| Priority              | Features                                                                                                        | Likelihood of Completion                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **MUST (P0)**         | Registration + anonymity + report creation + evidence upload + AI filter + moderation panel + publication delay | **95%** — These are non-negotiable for MVP               |
| **SHOULD (P1)**       | Full-text search + comments + votes + notifications                                                             | **75%** — Achievable if P0 stays on schedule             |
| **NICE-TO-HAVE (P2)** | Collaborative reports + admin dashboard + responsive polish + accessibility AA                                  | **40-50%** — Scope reduction likely here                 |
| **POST-MVP**          | Multi-tenant + mobile app + investigative tools + MAME Verify                                                   | **0%** in 11 weeks — These are post-launch roadmap items |

**Team velocity reality:** With 15+ students of varying experience levels, expect 30-40% slower velocity than professional teams. The sprint plan accounts for this with buffer in Sprint 4, but be prepared to cut P2 features if Sprint 2 or Sprint 3 run over.

**Key decision point:** End of Sprint 2 (Week 6). If the team is behind schedule, immediately descope collaborative reports (RF-23) and admin dashboard (RF-26) to Sprint 5+ and focus on the core moderation flow.
