# SRS — System Requirements Specification

> **MAME v2.0** — Complete Functional & Non-Functional Requirements
>
> *Synthesized from: `SRS_Requerimientos_v2 (2).pdf` (SRS v1.0, 11 pages) and `MAME_SRS_v2.pdf` (SRS v2.0, 7 pages)*

---

## 1. Introduction & Vision

### 1.1 Purpose

This document is the **technical contract** between the development team (15+ students) and the project stakeholders. Every development decision must be validated against this document.

### 1.2 System Scope

MAME is a publicly accessible web platform where anyone can register and anonymously report academic corruption and institutional irregularities. Its primary function is enabling **anonymous, verified publication** of reports about academic corruption, harassment, administrative irregularities, and other institutional problems, supported by **mandatory evidence** and **dual moderation** (AI + human).

### 1.3 Vision Statement

> Be the primary secure, anonymous, and verified channel for university students to expose corruption and institutional irregularities, backed by real evidence and the weight of an organized community.

### 1.4 Problem Context

| Current Problem | How MAME Solves It |
|---|---|
| WhatsApp groups expose who reports | Real cryptographic anonymity, decoupled from real profile |
| Fear of academic retaliation | System technically CANNOT reveal the reporter |
| Unverified reports create rumors | Mandatory evidence before publishing |
| Information is ephemeral, gets lost | Persistence, organization, and advanced search |
| No moderation or filters | Automatic AI moderation + human review |
| No case tracking | Complete lifecycle with auditable states |
| Limited to one institution | Multi-tenant architecture for multiple universities |

---

## 2. System Actors

| Actor | Description | Permissions |
|---|---|---|
| **Visitor** | Unregistered user | Read-only access to approved public reports and general feed |
| **Registered User** | Account verified via any valid email | Publish reports, comment, vote, join collaborative reports ("me too"), receive notifications. Operates with anonymous token. |
| **Moderator** | Volunteer student or designated editor | Review moderation queue, approve/reject (with mandatory reason for rejection), request more info, escalate to admin. **Cannot moderate reports from their own faculty.** Each action logged in immutable audit trail. |
| **Administrator** | Technical project team | Full admin panel, statistics dashboard, moderator management. **No special access to user identities.** |
| **Super Admin** | Founder / lead engineer | System configuration, multi-tenant management |
| **System (AI)** | Automated Worker | Executes illegal content filter BEFORE any human sees uploaded content |

---

## 3. Functional Requirements

### 3.1 Authentication & Anonymity Module

> **This is the most critical module.** The promise of anonymity must be real at a technical level, not just a policy. The architecture physically separates the user's real identity from their actions on the platform.

| RF | Description | Priority | Sprint | Implementation Details |
|---|---|---|---|---|
| **RF-01** | **Open registration with any valid email.** No institutional email required. Email stored as HMAC-SHA256 hash in our database, NEVER in plaintext. | MUST | S1 | Accept any valid-format email. Clerk.dev handles email verification and auth UI. On Clerk webhook `user.created`, backend stores `email_hash = HMAC-SHA256(email, ENCRYPTION_MASTER_KEY)` in `users` table. ENCRYPTION_MASTER_KEY lives in Cloudflare Secrets, never in DB. **Trust boundary:** Clerk stores the plaintext email on their SOC 2 Type II infrastructure for auth purposes. Our DB only has the irreversible HMAC hash. |
| **RF-02** | **Anonymous identity generation.** On email verification, system generates a cryptographic anonymous token completely decoupled from personal data. | MUST | S1 | Generate `UUID v4` as anonymous token. Store in `anonymous_profiles` table. Relationship stored as `relation_proof = HMAC-SHA256(email_hash + token_id, ENCRYPTION_RELATION_KEY)` in `identity_links` table (ultra-restricted access). Publications reference ONLY the token, never the email. |
| **RF-03** | **Secure login with rate limiting.** JWT with short expiration + refresh tokens. Max 5 failed login attempts → 15-minute block. | MUST | S1 | JWT signed with RS256 (asymmetric). Access token: 1 hour expiry. Refresh token: 7 days with automatic rotation (old one invalidated on use). No IP logs stored. Multiple sessions allowed without cross-information. |
| **RF-04** | **JWT signed with RS256**, expire in 1 hour, refresh token 7 days with automatic rotation. | MUST | S1 | Clerk.dev handles JWT signing with private RSA key. Backend verifies with public key. Asymmetric = even if public key leaks, attacker can't forge tokens. |
| **RF-05** | **Logout invalidates JWT and refresh token immediately** on the server side. | MUST | S1 | Token revoked in Clerk + internal blacklist. No session trace remains on server. |
| **RF-06** | **Account deletion.** User can request total deletion of account and associated tokens. | HIGH | — | Deletes user record. Anonymizes (does NOT delete) published reports by decoupling from token. Process audited by administrator. |

### 3.2 Publications & Evidence Module

| RF | Description | Priority | Sprint | Implementation Details |
|---|---|---|---|---|
| **RF-07** | **Publications require mandatory evidence.** Without at least 1 attached file, the backend rejects the submission. | MUST | S2 | Form fields: title (10-200 chars), detailed description (100-5000 chars), mandatory category, faculty/department, date of incident, minimum 1 evidence file. Backend validates all fields + file presence. |
| **RF-08** | **Accepted file formats:** JPG, PNG, PDF, MP4, MP3, WEBM. **Post client-side compression limits:** images ≤200KB (WebP), video ≤10sec/500KB, audio ≤60sec/300KB, PDF ≤2MB. Hard server reject at 5MB. **External video links:** YouTube/Google Drive URLs accepted as evidence (no file upload, no Cloudinary credits). | MUST | S2 | Verify file type by **magic number** (not declared extension). Files renamed to UUID v4 on upload. Original filename NEVER stored. Additional evidence can be added post-publication. External links stored as `evidence.type = 'external_link'` with validated URL. |
| **RF-09** | **Metadata stripping.** Before storing ANY file, system removes ALL EXIF metadata (images) and authorship metadata (PDFs). | MUST | S2 | **Client-side primary (browser):** Images → **piexifjs** strips ALL EXIF/GPS/device metadata, Canvas API re-encodes as WebP. PDFs → **pdf-lib** strips Title, Author, Subject, Creator, Producer, CreationDate, ModDate. Video/Audio → **MediaRecorder API** re-encodes (strips container metadata). **Server-side fallback:** Worker validates uploaded files and rejects any with residual EXIF/metadata (returns 422). Cloudinary `strip_profile` applied only if residual metadata detected post-upload (rare, preserves transformation credits). **Note:** Sharp and ffmpeg CANNOT run in Cloudflare Workers (V8 isolates have no native binary support) — client-side processing is the only viable approach. |
| **RF-10** | **AI content filter analyzes text AND images.** Two-tier moderation: (1) synchronous illegal content scan during upload — hard-rejected files NEVER uploaded to Cloudinary; (2) async policy/quality moderation via Cloudflare Queue for content stored with `PENDING` status. | MUST | S2 | Workers AI on the edge. **Text moderation:** Llama Guard 3 (`@cf/meta/llama-guard-3-8b`) for safety classification (drugs, weapons, CSAM, grooming, trafficking, violence). **Image moderation:** Llama 3.2 Vision (`@cf/meta/llama-3.2-11b-vision-instruct`) for NSFW/violent/exploitative content detection. **CSAM detection:** Perceptual hashing (pHash) against locally-maintained hash lists + mandatory reporting to NCMEC CyberTipline if suspected CSAM is detected (legal obligation). **Note:** Direct access to NCMEC's hash database requires ESP registration — the system uses AI-based detection as primary defense with human escalation for edge cases. **Hard-rejected files** (illegal content) = never uploaded to Cloudinary. Report metadata stored in DB with `PENDING` status for audit trail, then marked `REJECTED` with files queued for deletion. |
| **RF-11** | **Evidence files delivered via Cloudflare CDN proxy** (Worker caches Cloudinary signed URLs at edge with 24h TTL). Storage is private (authenticated delivery). | MUST | S2 | Cloudinary configured for authenticated delivery. The CDN proxy Worker intercepts evidence requests, checks Cloudflare Cache API first (24h TTL), and only fetches from Cloudinary on cache miss. ~90%+ cache hit rate eliminates Cloudinary bandwidth credits. Signed URL with expiration generated per access. No permanent public URLs for evidence. |
| **RF-12** | **Approved publications published with random 1-6 hour delay** to prevent temporal correlation. | MUST | S3 | Via Cloudflare Queues. When moderator approves, report enters queue with random delay (1-6h). Prevents adversaries from correlating "report appeared at 3pm → who submitted something around 3pm?" |
| **RF-13** | **Full-text search with results in < 500ms** and cursor-based pagination. | SHOULD | S2 | PostgreSQL GIN index on `tsvector` of (title \|\| content). Ranking by relevance + recency. Cursor-based pagination (not offset). |
| **RF-14** | **Predefined report categories**, editable by administrator. | HIGH | S2 | Initial categories: Sexual Harassment/Abuse, Academic Corruption, Faculty Plagiarism, Discrimination, Nepotism, Administrative Irregularities, Fraud, Other. |
| **RF-15** | **Report lifecycle states** that reflect progress. | HIGH | S2 | States: `Draft → Under Review → Published → Under Investigation → Resolved / Archived / Rejected`. Only moderators and admins change states. Each state change recorded with timestamp + moderator token. |

### 3.3 Moderation Module

| RF | Description | Priority | Sprint | Implementation Details |
|---|---|---|---|---|
| **RF-16** | **ABSOLUTE automatic filter for criminal content.** CSAM, drugs, weapons, violence incitement, grooming, human trafficking. NEVER reaches human moderation. NEVER stored in DB or Cloudinary. | MUST | S2 | BLOCK WITHOUT EXCEPTION: (1) Child sexual abuse material — MAXIMUM priority, forensic log of attempt; (2) Drug sale promotion/facilitation; (3) Weapon trafficking/manufacturing instructions; (4) Violence/terrorism/hate incitement; (5) Minor grooming/harassment; (6) Human trafficking. All rejected with forensic log of attempt + token that attempted it. |
| **RF-17** | **Human moderation panel.** Dedicated interface for moderators to review the queue. | MUST | S3 | Queue ordered by submission date. Actions: Approve, Reject (with mandatory reason selection), Request more information, Edit sensitive data before publishing, Escalate to admin. Each action = immutable audit log entry. |
| **RF-18** | **Moderators CANNOT see or moderate reports from their own faculty.** System detects conflict automatically. | MUST | S3 | System compares moderator's faculty with report's faculty. On match: report hidden from that moderator, auto-reassigned to another. |
| **RF-19** | **Every moderation action recorded in immutable audit log** with timestamp and moderator's anonymous token. | MUST | S3 | `moderation_log` table: report_id, moderator_token, action, reason, timestamp. Immutable (no UPDATE or DELETE on this table). |
| **RF-20** | **Community reports (flagging).** Any user can flag a published post. Accumulated flags trigger urgent review. | HIGH | S3 | Report categories: False report, Inappropriate content, Exposed private data, Harassment, Other. Threshold accumulation activates automatic re-review. |
| **RF-21** | **Token suspension for repeated abuse.** Automatic suspension after X rejections/reports. Real user never identified. | HIGH | S3 | Token-level suspension, not user-level. The real user is never identified through this process. For legal cases, a documented and audited protocol exists (see Security doc). |

### 3.4 Social Module

| RF | Description | Priority | Sprint | Implementation Details |
|---|---|---|---|---|
| **RF-22** | **Anonymous comments** up to 1000 characters with same automatic filter pipeline as reports. 2-level nesting. | HIGH | S3 | Comments pass through identical Workers AI filter. Comment voting supported. Max 2 levels of nesting (comment → reply, no deeper). |
| **RF-23** | **Collaborative reports ("Me too").** Users can join an existing report with their own description and evidence. Public counter, anonymous identities. | SHOULD | S3 | `POST /reports/:id/support` with optional description + evidence. Public counter of supporters visible. Individual supporter identities NOT visible. Strengthens report credibility. |
| **RF-24** | **Anonymous votes.** 1 vote per user per report. Counter visible publicly, voter invisible. | SHOULD | S3 | Atomic counter in DB. `UNIQUE(report_id, token_id)` constraint prevents double voting. No public table linking votes to tokens. |
| **RF-25** | **In-app notifications** (no email, to maintain decoupling). Notify on: state change, new collaborator evidence, moderator response. Delay < 5 minutes. | SHOULD | S3 | `notifications` table in DB. Polling or simple WebSocket. Payload contains NO identifiable data. |

### 3.5 Administration Module

| RF | Description | Priority | Sprint | Implementation Details |
|---|---|---|---|---|
| **RF-26** | **Statistics dashboard** with anonymized metrics. Reports by category/faculty/month/state, active users, suspended tokens, average moderation time. | HIGH | S4 | Chart.js for graphs. Data fully anonymized — no personal data in dashboard. Admin-only access. |
| **RF-27** | **Multi-tenant architecture.** Each university with isolated data space. Configurable email domains per tenant. Global admin manages all tenants. | MEDIUM | Post-v1.0 | `tenants` table with id, name, email_domains, config. Data isolation at query level. |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Requirement | Condition |
|---|---|---|
| API response time | < 200ms | P95 under normal load |
| Page load | < 2 seconds | 4G connection, first load |
| Page load (cached) | < 500ms | ISR-cached pages from Cloudflare CDN |
| Function invocations | ≤45K/day (of 100K limit) | With ISR caching: 80%+ page views served from CDN, only dynamic writes + searches + ISR revalidation hit actual functions. |
| Concurrent users | ~275 at peak (11am weekday) | ISR serves cached pages. Only write operations require live function execution. |
| Evidence upload | < 15 seconds | After client-side compression (≤200KB images, ≤500KB video, ≤300KB audio) |
| Full-text search | < 500ms | DB with ~90K records (month 4). GIN indexes on search_vector. |
| LCP (Lighthouse) | < 2.5 seconds | Simulated 4G |
| Upload progress | Visible progress bar | All file uploads |

### 4.2 Scalability

| Scenario | Required Capacity | Free Tier Strategy |
|---|---|---|
| Total registered users | 50,000 in 4 months | Clerk: 50K MRU (no CC). Hits limit month 4 → upgrade with funding. |
| Daily active users | 10,000 DAU by month 4 | ISR caching: 80%+ reads from CDN = ~45K function invocations/day (within 100K). |
| Peak concurrency | ~275 simultaneous (11am peak) | University traffic pattern. ISR serves cached pages. Writes are <15% of traffic. |
| Daily publications | 500–1,000 reports/day + 3,750 comments + 7,500 votes | Client-compressed media (≤200KB avg). ~22 of 25 Cloudinary credits used in month 4. |
| Evidence storage | ~18GB cumulative by month 4 | Client-side compression: images ≤200KB WebP, video ≤10sec/500KB, audio ≤60sec/300KB, PDFs ≤2MB. CDN proxy eliminates bandwidth credits. |
| DB storage | ~430MB by month 4 | 90K reports + 450K comments + 50K users + indexes. TOAST compression on long text. Fits 500MB with ~70MB margin. |
| Growth projection | Month 5+: funded upgrades | Hexagonal architecture enables service swaps. Priority: Clerk Pro → R2 storage → Workers Paid. |

> **Scaling Reality:** The free tier supports 50K users and 10K DAU through aggressive ISR caching, client-side media processing, and CDN proxying. The system is designed to hit its limits at exactly month 4 — coinciding with the planned funding timeline.

### 4.3 Security

- HTTPS mandatory with TLS 1.3 on all communications
- Passwords managed entirely by Clerk.dev (password hashing on their infrastructure) — passwords never stored in our database
- JWT signed with RS256 (asymmetric), NOT HS256
- Rate limiting on all endpoints: 100 req/min per IP (public), 20 req/min (write operations)
- Input sanitization on both frontend and backend (XSS, SQL injection prevention)
- Strict CORS: only authorized domains
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- Audit logging on all sensitive actions: moderation, suspension, admin changes
- Penetration testing before public launch (OWASP ZAP)
- Automatic key rotation every 90 days
- No email or identifiable data stored in plaintext in our database (Clerk stores emails on their infrastructure as auth trust delegate — see Privacy section)
- No user IPs stored in any log or table
- All files processed (metadata stripped **client-side** via piexifjs/pdf-lib before upload; server rejects files with residual metadata as fallback)
- OWASP ZAP scan with zero critical/high vulnerabilities before launch

### 4.4 Privacy

- NO IP logs of authenticated users stored anywhere
- Evidence files renamed to UUID on upload (original name never stored)
- User email stored as HMAC-SHA256 hash in our database (one-way, irreversible without ENCRYPTION_MASTER_KEY)
- **Clerk trust boundary:** Clerk.dev stores plaintext emails on their SOC 2 Type II infrastructure for authentication. Our database never contains plaintext emails. This is a deliberate tradeoff — Clerk compromise alone cannot link emails to anonymous tokens.
- Email-token relationship stored as one-way HMAC hash (requires both ENCRYPTION_MASTER_KEY and ENCRYPTION_RELATION_KEY to reverse)
- User can delete account and personal data at any time (right to be forgotten)
- Deleted reports are anonymized, not removed (to preserve testimony integrity)
- Minors: if a report involves minors, identity protected by double anonymization

### 4.5 Availability

| Metric | Target |
|---|---|
| Annual availability | 99.5% (max 43 hours downtime/year) |
| Recovery Time Objective (RTO) | < 2 hours on critical failure |
| Recovery Point Objective (RPO) | Max 1 hour of lost data |
| Automatic backups | Every 6 hours, 30-day retention |
| Scheduled maintenance | 2-hour windows on Sunday mornings |
| Rollback | Automatic if health check fails post-deploy |

### 4.6 Maintainability

- Automated test coverage minimum 80% on backend code
- API documentation with OpenAPI/Swagger updated on every release
- Mandatory linters (ESLint, Prettier) in CI pipeline
- Conventional Commits for automatic changelog generation
- Feature branches + mandatory PR with at least 1 reviewer
- Docker Compose for identical development environment across 15+ students
- `.env.example` versioned in repo (never real values)
- CI/CD: automatic tests on every PR, merge blocked if tests fail

---

## 5. Business Rules

| ID | Rule | Consequence If Violated |
|---|---|---|
| **BR-01** | Cannot publish without at least 1 evidence file | System blocks form submission (frontend + backend) |
| **BR-02** | Email must have valid format (user@domain.ext). No specific domain required. | Registration rejected if invalid email format |
| **BR-03** | Cannot defame without evidence | Moderation rejects evidence-less reports |
| **BR-04** | Maximum 10 reports per token per day | Rate limit activated, token temporarily limited |
| **BR-05** | NSFW/illegal content never reaches human moderation | Automatically rejected with message to user |
| **BR-06** | Approved reports are permanent even if author deletes account | Reports are anonymized but not deleted, to protect testimony integrity |
| **BR-07** | Moderator cannot approve reports about their own faculty | System detects conflict and reassigns to another moderator |
| **BR-08** | High-category reports (sexual harassment) require ≥ 2 moderator approvals | Single approval is not sufficient for that category |

---

## 6. Interface Requirements

### 6.1 User Interface
- Responsive design: functional on mobile (320px), tablet, and desktop
- Dark mode and light mode
- Accessibility: WCAG 2.1 Level AA minimum
- Spanish as primary language, i18n architecture ready for other languages
- Progressive loading: user sees content before everything finishes loading
- No third-party tracking cookies
- Touch targets minimum 44x44px on mobile
- First-time user can complete registration → first publication without tutorial

### 6.2 System Interfaces
- REST API documented with OpenAPI 3.0
- Webhooks for future integrations
- Separate moderation API with role-based authentication
- Admin panel on separate subdomain

---

## 7. Project Constraints

| Constraint | Description | Impact |
|---|---|---|
| **Budget** | Zero dollars. Entire stack must be free | Limits infrastructure options |
| **Team** | 15+ students with different experience levels | Requires standardized, documented code |
| **Timeline** | University project with academic deadlines | MVP first, advanced features later |
| **Infrastructure** | Only services with robust free tiers and NO credit card requirement for 4 months | Cloudflare (Pages + Workers + KV + Queues + AI), Neon.tech, Cloudinary, Clerk.dev |
| **Legal** | Cannot identify users without court order | Anonymity architecture is non-negotiable |
| **Content** | Cannot host illegal content | Automatic AI moderation mandatory before any publication |

---

## 8. MVP Acceptance Criteria

The system is ready for public launch when ALL of the following are met:

1. **Anyone can register** with any valid email and receive verification in < 2 minutes
2. **Anonymous token is NOT traceable** to the email, even with direct plaintext database access
3. **Report without evidence is impossible** to submit (blocked on frontend AND backend)
4. **NSFW/illegal content detected and rejected** automatically before reaching moderation
5. **Approved report visible publicly** in < 24 hours from submission
6. **~275 concurrent users at peak** without measurable performance degradation (ISR-cached pages + CDN delivery)
7. **Moderation panel** allows processing 50 reports/hour per moderator
8. **Security scan** (OWASP ZAP) passes with zero critical or high vulnerabilities
