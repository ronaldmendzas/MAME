# SAD — Software Architecture Document

> **MAME v2.0** — Complete Architecture, Design Patterns, Data Model & Deployment
>
> *Synthesized from: `SAD_Arquitectura_v2 (2).pdf` (SAD v1.0, 13 pages) and stack details from `MAME_SRS_v2.pdf` (SRS v2.0)*

---

## 1. Non-Negotiable Design Principles

Every architectural decision MUST be validated against these three principles:

| Principle | Definition | Example |
|---|---|---|
| **Real Anonymity** | Not just a policy — the architecture physically prevents linking user identity to their actions | Email stored as HMAC-SHA256 hash, publications reference UUID tokens only |
| **Zero Cost** | Entire infrastructure runs on free tier services. Budget is $0 USD. **No credit card required for any service.** | All services selected for generous free tiers that require NO payment method |
| **Long-Term Maintainability** | 15+ students of varying skill levels must be able to maintain and extend the system | TypeScript strict, standardized patterns, hexagonal architecture |

---

## 2. Architecture Type: Hexagonal + Serverless

### 2.1 Why Hexagonal Architecture?

For a team of 15+ people, simple MVC becomes unmaintainable fast. Hexagonal (Ports & Adapters) provides:

- **Domain logic** is completely isolated from infrastructure (database, API, auth)
- **Ports** = interfaces that define what the domain needs (e.g., `ReportRepository`)
- **Adapters** = concrete implementations (e.g., `NeonReportRepository`, `MockReportRepository`)
- If we need to replace Neon with another DB, we only change the adapter — domain logic stays untouched
- Testing is trivial: inject mock adapters, test business rules without real DB

### 2.2 Why NOT Simple MVC?

- With 15+ people, MVC becomes a monolith where controllers grow to 1000+ lines
- Business logic leaks into controllers and models
- Changing infrastructure requires touching business code
- Testing requires real databases or complex mocking

### 2.3 Combined with Serverless & Event-Driven

- **Serverless** via Cloudflare Workers: no servers to manage, auto-scaling, pay-per-request (free tier covers our needs)
- **Event-Driven** for moderation pipeline: report creation triggers async queue → AI analysis → human review → publication
- **CQRS-Inspired Separation** for organized read/write code paths (code-level separation, not infrastructure-level CQRS)

---

## 3. High-Level System View

```
┌────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Client    │────▶│   Vercel     │────▶│  Cloudflare      │
│  (Browser)  │     │  (Next.js 15)│     │  Workers (Hono)  │
└────────────┘     └──────────────┘     └──────┬───────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────┐
                    │                          │                      │
              ┌─────▼─────┐           ┌────────▼───────┐    ┌───────▼──────┐
              │  Clerk.dev │           │   Neon         │    │  Cloudinary  │
              │  (Auth)    │           │   PostgreSQL   │    │  (Storage)   │
              └────────────┘           └────────────────┘    └──────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────┐
                    │                          │                      │
              ┌─────▼─────┐           ┌────────▼───────┐    ┌───────▼──────┐
              │ Cloudflare │           │  Cloudflare    │    │   Workers    │
              │ KV (Cache) │           │  Queues        │    │   AI         │
              └────────────┘           └────────────────┘    └──────────────┘
```

### All 10 Layers

| Layer | Technology | Responsibility | Deploy Location | Free Tier |
|---|---|---|---|---|
| **CDN / Edge** | Cloudflare Network | DDoS protection, WAF, SSL termination, edge caching, **CDN proxy for Cloudinary media** | Cloudflare global | Unlimited bandwidth. |
| **Frontend** | Next.js 15 (App Router) | SSR/ISR/SSG, responsive UI, client-side state, auth integration | **Cloudflare Pages** | **Unlimited bandwidth.** No CC. |
| **API Gateway** | Cloudflare Pages Functions | Request routing, rate limiting, CORS, auth verification | Cloudflare edge | 100K req/day (shared with Workers). No CC. |
| **Backend** | Hono.js on Workers | Write operations, AI orchestration, queue consumers | Cloudflare edge | 100K req/day (shared with Pages). No CC. |
| **Authentication** | Clerk.dev | User management, JWT RS256, roles, webhooks | Clerk infrastructure | 50K MRU. No CC. |
| **Database** | Neon PostgreSQL 16 | Persistent data, full-text search, relational integrity | AWS us-east-1 (Neon) | 500MB storage. No CC. |
| **Cache** | Cloudflare KV | Rate limit counters, config cache (write-batched) | Cloudflare edge | 100K reads/day, 1K writes/day. No CC. |
| **Queue** | Cloudflare Queues | Async moderation pipeline, publication delay | Cloudflare | 1M messages/mo. No CC. |
| **File Storage** | Cloudinary + **Cloudflare CDN proxy** | Evidence files. Client-compressed, CDN-cached. | Cloudinary + CF edge | 25 credits/mo (~22 used). **No CC.** |
| **AI Moderation** | Workers AI | Content safety analysis (text + images) | Cloudflare edge | 10K neurons/day. No CC. |

---

## 4. Technology Stack — Detailed Justification

### 4.1 Frontend: Next.js 15 + TypeScript + Tailwind CSS

| Aspect | Detail |
|---|---|
| **Framework** | Next.js 15 with App Router (server components by default) |
| **Language** | TypeScript in strict mode — catches type errors at compile time |
| **Styling** | Tailwind CSS — utility-first, no CSS file proliferation |
| **Validation** | Zod schemas shared between frontend and backend |
| **Deploy** | **Cloudflare Pages** — unlimited bandwidth, auto-deploy on push, preview environments per branch. **No CC.** |
| **Why Next.js 15** | SSR for SEO + performance, React Server Components reduce client JS, App Router modern patterns, massive ecosystem |
| **ISR Strategy** | Feed and report pages use **Incremental Static Regeneration** (60s revalidation for feed, on-demand for reports). 80%+ of page views served from Cloudflare CDN cache — **no function invocation required.** This is how 10K DAU fits in 100K req/day. |
| **Client-Side Processing** | Browser handles media compression (Canvas API → WebP ≤200KB), EXIF stripping (piexifjs), PDF metadata removal (pdf-lib). Zero server-side transforms = zero Cloudinary transformation credits. |

### 4.2 Backend: Hono.js on Cloudflare Workers

| Aspect | Detail |
|---|---|
| **Framework** | Hono.js — < 15KB, Express-like API, TypeScript-first, native Workers support |
| **Runtime** | Cloudflare Workers — edge-native serverless, V8 isolates, 0ms cold start |
| **ORM** | Drizzle ORM — native prepared statements, versioned migrations, TypeScript schemas |
| **Endpoints** | RESTful with OpenAPI 3.0 documentation per release |
| **Why Hono** | Ultralight (< 15KB vs Express 5MB+), designed for Workers, type-safe routes, middleware system, no cold start penalty |

### 4.3 Database: Neon PostgreSQL (Serverless)

| Aspect | Detail |
|---|---|
| **Engine** | PostgreSQL 16 — full ACID, GIN indexes for full-text search, triggers |
| **Provider** | Neon.tech — serverless Postgres with auto-scaling, connection pooling via pgBouncer |
| **Branching** | Database branches for dev/staging/prod (like Git branches for your DB) |
| **Free Tier** | 500MB storage, 1 project with branches, pgBouncer pooling |
| **Why PostgreSQL** | Best open-source relational DB for complex queries, excellent full-text search via tsvector/GIN, ACID compliance critical for moderation audit trails |

### 4.4 Cache: Cloudflare KV

| Aspect | Detail |
|---|---|
| **Type** | Globally distributed key-value store |
| **Read Latency** | Microseconds (served from nearest edge location) |
| **Use Cases** | Feed cache, session data, rate limit counters |
| **Free Tier** | 1GB storage, 100K reads/day, 1K writes/day |

> **KV Write Batching Strategy:** At 10K DAU with 750+ reports/day + comments + votes, naive cache invalidation would exceed 1K writes/day. Solution: aggregate invalidation — a Worker batches multiple cache-busting events into a single KV write every 30 seconds via a Durable Object or Queue. Feed cache is handled by ISR (not KV), so KV writes are primarily rate limit counters + config = ~300-500 writes/day.

### 4.5 File Storage: Cloudinary (Primary)

| Aspect | Detail |
|---|---|
| **Type** | Cloud-based media management and CDN delivery |
| **Key Feature** | **NO credit card required** for free tier. Built-in image/video transformations. CDN delivery. |
| **Access** | Authenticated delivery via signed URLs with time-limited tokens |
| **Free Tier** | 25 credits/month. 1 credit = 1GB storage OR 1GB bandwidth OR 1,000 transformations (credits are shared across all usage types). **No CC.** |
| **Why Cloudinary over R2** | Cloudflare R2 requires credit card verification even for the free tier. For a student project with $0 budget and no payment methods, this is a hard blocker. Cloudinary provides similar functionality (signed URLs, CDN, transformations) with zero CC requirement. |
| **SDK** | Official Node.js SDK (`cloudinary` npm package) for upload, transform, and signed URL generation |
| **Metadata Stripping** | **Client-side primary:** piexifjs strips EXIF from images in the browser. pdf-lib strips PDF metadata in the browser. Server-side `strip_profile` is a **fallback** only, not the default path, preserving transformation credits. |
| **CDN Proxy** | A Cloudflare Worker proxies all Cloudinary URLs through the Cloudflare Cache API (24h TTL). Repeat views of the same file are served from Cloudflare edge (free, unlimited bandwidth) instead of Cloudinary CDN (which costs bandwidth credits). Cache hit rate ~90%+. **This reduces Cloudinary bandwidth from ~240 credits/month to ~4 credits/month.** |

> **Optional Upgrade:** If any team member can provide a credit card for verification (Cloudflare does NOT charge), Cloudflare R2 can be added as a secondary/replacement storage with S3-compatible API, zero egress fees, and 10GB free. The hexagonal architecture allows swapping storage adapters without changing domain logic.

### 4.6 Authentication: Clerk.dev

| Aspect | Detail |
|---|---|
| **Features** | Email verification, JWT RS256, refresh token rotation, role management, pre-built UI components, webhooks |
| **Free Tier** | 50,000 monthly retained users (MRU). **No credit card required.** |
| **Why Clerk** | Zero auth code to write, pre-built login/register components, JWT RS256 out of the box, role system built-in, webhook for sync events to our DB |
| **SOC 2 Type II** | Clerk is audited for security, availability, and confidentiality controls |

> **⚠️ Clerk Trust Boundary:**
> Clerk stores plaintext user emails on their infrastructure for authentication (email verification, login, password reset). Our database **never** stores plaintext emails — only `HMAC-SHA256(email, ENCRYPTION_MASTER_KEY)` hashes.
>
> **Why this is acceptable:**
> 1. Custom auth is the #1 attack vector in student projects — Clerk eliminates this entire vulnerability class
> 2. Clerk is SOC 2 Type II certified with enterprise security controls
> 3. Compromising Clerk alone does NOT break anonymity — attacker gets emails but cannot link them to anonymous tokens (that mapping requires our ENCRYPTION_MASTER_KEY + ENCRYPTION_RELATION_KEY)
> 4. Compromising our DB alone does NOT expose emails — only irreversible HMAC hashes
> 5. **Both** systems + **both** keys must be compromised simultaneously to de-anonymize
>
> **Future migration path:** If the project outgrows Clerk's 50K MRU limit or requires full zero-knowledge auth, the hexagonal architecture allows replacing Clerk with a custom HMAC-based login system (see Strangler Fig Pattern below). This migration swaps only the auth adapter — domain logic remains untouched.

### 4.7 AI Moderation: Cloudflare Workers AI

| Aspect | Detail |
|---|---|
| **Content Safety** | `@cf/meta/llama-guard-3-8b` — purpose-built safety classifier for drugs, weapons, CSAM, grooming, trafficking, hate speech, violence incitement |
| **Image Analysis** | `@cf/meta/llama-3.2-11b-vision-instruct` — multimodal model for NSFW, violent, and exploitative image detection |
| **CSAM Detection** | Perceptual hashing (pHash) against locally-maintained hash lists. **Note:** Direct NCMEC hash database access requires ESP (Electronic Service Provider) registration, which requires corporate entity status. MAME uses AI-based detection as primary defense + mandatory NCMEC CyberTipline reporting if suspected CSAM detected (legal obligation under 18 U.S.C. § 2258A). |
| **Free Tier** | 10,000 neurons/day |
| **Fallback** | If AI accuracy < 90%, system degrades to human-only moderation (all content queued for manual review) |

### 4.8 Other Services

| Service | Purpose | Free Tier |
|---|---|---|
| **Resend.com** | Transactional email (verification codes, notifications) | 3,000 emails/month. No CC. |
| **Sentry.io** | Error monitoring and performance tracking (configured to exclude personal data) | 5,000 errors/month, 1 user. No CC. |
| **GitHub Actions** | CI/CD pipeline (lint, type-check, tests, deploy) | 2,000 minutes/month. No CC. |

---

## 5. Why NOT These Alternatives

| Rejected Technology | Reason |
|---|---|
| **Spring Boot / Java** | Requires 512MB+ RAM minimum — impossible on any free serverless tier. Excessive boilerplate for a student team. |
| **MongoDB** | NoSQL complicates relational queries needed for reports ↔ evidence ↔ comments ↔ moderation. Limited full-text search compared to PostgreSQL GIN indexes. |
| **Firebase (Firestore)** | Google vendor lock-in. NoSQL not ideal for relational data. Unpredictable costs at scale. |
| **Supabase** | 2-project limit on free tier (already occupied by other projects). Connection limits too restrictive for 15+ concurrent developers. |
| **Express.js** | Slower than Hono on Workers. Doesn't run natively on Cloudflare Workers. Considered legacy compared to Hono/Elysia. |
| **AWS S3** | Charges for egress bandwidth — potentially expensive for a platform serving lots of evidence files. Requires credit card. |
| **Full Microservices** | Enormous operational overhead (service mesh, discovery, distributed tracing) beyond student team capacity. Hexagonal monolith provides similar isolation with less complexity. |
| **GraphQL** | Learning curve without clear benefit for this use case. REST with well-designed endpoints is simpler and sufficient. |
| **Rust / Go** | Ecosystem less mature for auth/email/moderation integrations. TypeScript reduces onboarding friction for a 15+ student team. |

---

## 6. Design Patterns

### 6.1 Repository Pattern

Abstracts data access behind interfaces. Business logic NEVER touches SQL directly.

```typescript
// Port (interface) — domain defines what it needs
interface ReportRepository {
  findById(id: string): Promise<Report | null>;
  findPublished(cursor?: string, limit?: number): Promise<Report[]>;
  save(report: Report): Promise<void>;
  updateStatus(id: string, status: ReportStatus): Promise<void>;
  search(query: string, cursor?: string): Promise<Report[]>;
}

// Adapter (implementation) — infrastructure provides it
class NeonReportRepository implements ReportRepository {
  // Uses Drizzle ORM to talk to Neon PostgreSQL
}

// For testing
class MockReportRepository implements ReportRepository {
  // In-memory implementation, no real DB needed
}
```

### 6.2 CQRS-Inspired Separation (Code Organization)

We organize handlers into Commands (writes) and Queries (reads) for code clarity. This is **code-level organization, not infrastructure-level CQRS** — both commands and queries hit the same PostgreSQL database through the same Drizzle ORM connection. There are no separate read/write databases, no event sourcing, and no eventual consistency. Think of it as a naming convention that makes the codebase easier to navigate.

**Commands (Write):**

| Command | Description | Sprint |
|---|---|---|
| `CreateReport` | Create new report with evidence | S2 |
| `AddEvidence` | Attach additional evidence to report | S2 |
| `ModerateReport` | Approve/reject/request info | S3 |
| `SuspendToken` | Suspend user's anonymous token | S3 |
| `SubmitComment` | Add comment to report | S3 |
| `VoteOnReport` | Cast anonymous vote | S3 |
| `SupportReport` | Join collaborative "me too" report | S3 |

**Queries (Read):**

| Query | Description | Sprint |
|---|---|---|
| `GetPublishedReports` | Feed with cursor pagination | S2 |
| `SearchReports` | Full-text search with ranking | S2 |
| `GetReportById` | Single report with evidence/comments | S2 |
| `GetReportStats` | Anonymized statistics for admin | S4 |
| `GetCommentsByReport` | Nested comments for a report | S3 |
| `GetModerationQueue` | Pending reports for moderators | S3 |
| `GetNotifications` | User's notification list | S3 |

### 6.3 Observer / Event-Driven (Moderation Pipeline)

The moderation pipeline is fully event-driven. No synchronous blocking of the user.

**8-Step Flow:**
1. User creates report → stored in DB with status `PENDING`
2. `ReportCreated` event emitted
3. Event enters Cloudflare Queue
4. Queue triggers Worker AI analysis
5. AI passes → `ReportReadyForHumanReview` event → enters moderation queue
6. AI rejects → `ReportAutoRejected` event → user notified, content NEVER stored
7. Moderator approves → `ReportApproved` event → random 1-6h delay in Queue
8. Delay expires → `ReportPublished` event → visible in feed, reporter notified

#### Webhook Idempotency (Clerk `user.created`)

Clerk's `user.created` webhook triggers creation of 3 linked records: `users` (HMAC hash only), `anonymous_profiles`, and `identity_links`. A partial failure or Clerk retry could leave the DB in an inconsistent state.

**Idempotency Strategy:**

1. **Idempotency key:** Use `clerk_id` as natural idempotency key. Before processing, `SELECT` by `clerk_id` — if record exists, return 200 OK immediately (skip duplicate).
2. **Transaction wrapping:** All 3 inserts (`users` + `anonymous_profiles` + `identity_links`) execute inside a single PostgreSQL transaction. If any step fails, the entire transaction rolls back — no orphan records.
3. **Clerk retry handling:** Clerk retries webhooks with the same payload. The idempotency check (step 1) ensures retries are no-ops that return 200 OK.
4. **Svix signature verification:** Every webhook is verified against Clerk's Svix signing secret before processing. Invalid signatures are rejected with 401.

```
POST /webhooks/clerk → Verify Svix signature
  → Extract clerk_id from payload
  → SELECT users WHERE clerk_id = $1
  → IF exists → return 200 OK (idempotent)
  → BEGIN TRANSACTION
    → INSERT users (clerk_id, email_hash)
    → INSERT anonymous_profiles (token_id)
    → INSERT identity_links (clerk_id → token_id)
  → COMMIT
  → return 201 Created
  → ON ERROR → ROLLBACK → return 500
```

### 6.4 Factory Pattern (Evidence Processing)

Different file types need different processing pipelines. **Client-side compression and metadata stripping are mandatory** to stay within Cloudinary's 25 credits/month at 10K DAU scale.

| Evidence Type | Client-Side (Browser) | Server-Side (Worker) |
|---|---|---|
| **Image** (JPG, PNG) | Canvas API resizes to ≤1920px → exports as WebP ≤200KB. **piexifjs** strips ALL EXIF/GPS/device metadata. | Validate magic number → Workers AI (Llama 3.2 Vision) NSFW check → pHash duplicate detection → Rename to UUID → Upload to Cloudinary (`resource_type: 'image'`). **Fallback:** if EXIF detected post-upload, apply `strip_profile` (rare, saves transform credits). |
| **Video** (MP4, ≤10 sec) | MediaRecorder API records/re-encodes to ≤10 seconds, ≤500KB. Longer videos → user pastes YouTube/Google Drive link instead. | Validate magic number → Workers AI frame analysis → Rename to UUID → Upload to Cloudinary (`resource_type: 'video'`). |
| **Audio** (MP3, ≤60 sec) | MediaRecorder API limits to 60 seconds, ≤300KB. | Validate magic number → Rename to UUID → Upload to Cloudinary (`resource_type: 'video'`). |
| **Document** (PDF, ≤2MB) | **pdf-lib** (pure JS) strips author, creation date, program in browser. | Validate magic number → Workers AI (Llama Guard 3) text extraction + analysis → Rename to UUID → Upload to Cloudinary. |
| **External Video Link** | User pastes YouTube/Drive URL. Frontend embeds player. | Worker validates URL format + reachability. Stored as `evidence.type = 'external_link'` in DB. No Cloudinary credits used. |

> **⚠️ Why client-side processing?** At 750+ reports/day (80% with media = 18,000 files/month), using Cloudinary server-side transformations (`strip_profile`, resize, transcode) would cost **~18 credits/month in transforms alone**, leaving only 7 credits for storage+bandwidth. By doing ALL compression and metadata stripping in the browser, we spend **0 transform credits** and reduce file sizes by 80%+, extending storage credits dramatically.
>
> **Security note:** Client-side EXIF stripping can be bypassed by a malicious user. The server validates uploaded files and rejects any with EXIF data intact (returns 422 with instructions to re-upload). This is a defense-in-depth approach — the client does the work, the server enforces the rule.
>
> **Why no Sharp/ffmpeg?** Cloudflare Workers are V8 isolates with NO file system, NO native binary execution. Sharp requires `libvips` (C library) and ffmpeg is a compiled binary — both architecturally impossible in Workers. Client-side processing is not just a cost optimization — it's the only viable approach.

### 6.5 Middleware Chain

6 middlewares execute in sequence on every request:

| Middleware | Responsibility | Scope |
|---|---|---|
| `corsMiddleware` | Validates origin against MAME domain whitelist | All requests |
| `rateLimitMiddleware` | Enforces rate limits (100/min public, 20/min write) | All requests |
| `authMiddleware` | Verifies JWT RS256 signature via Clerk public key | Protected routes |
| `validationMiddleware` | Validates request body/params against Zod schemas | Write endpoints |
| `contentFilterMiddleware` | Runs AI content filter on text/file inputs | Create/update reports/comments |
| `auditMiddleware` | Logs sensitive actions to immutable audit trail | Moderation/admin actions |

### 6.6 Strangler Fig Pattern (Future Migrations)

When a free tier is exceeded (or at month 5 with funding), we can progressively upgrade services:

| Current Service | Funded Upgrade (Month 5+) | Trigger | Est. Cost |
|---|---|---|---|
| Clerk.dev (50K MRU) | Clerk Pro ($25 base + $0.02/MRU beyond 10K) or custom Jose JWT + HMAC auth | Month 4: hits 50K ceiling | $25-$825/mo |
| Cloudinary (25 credits) | Cloudflare R2 (10GB free, requires CC, $0 egress) | Storage + bandwidth credits exhausted | $0 (just CC) |
| Pages+Workers (100K req/day) | Workers Paid ($5/mo + $0.50/M req) | >100K function invocations/day | $5-$10/mo |
| Neon PostgreSQL (500MB) | Neon Launch ($19/mo, 10GB) | >500MB data | $19/mo |
| Cloudflare KV (1K writes/day) | Workers KV Paid (included in Workers Paid) | >1K writes/day | Included |
| Sentry.io (1 user) | Sentry Team ($26/mo, 5 users) | >1 user needing access | $26/mo |

The hexagonal architecture makes this possible: swap the adapter, keep the domain logic. **No service change requires rewriting business logic.**

---

## 7. Data Model

### 7.1 Core Tables

> **CRITICAL SECURITY PRINCIPLE:** Tables containing real identity (`users`, `identity_links`) are PHYSICALLY AND CRYPTOGRAPHICALLY separated from content tables (`reports`, `comments`, `votes`). There is NO foreign key from `anonymous_profiles` to `users` in plaintext.

#### `users` — MAXIMUM SECRET

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Internal user ID, never exposed |
| `clerk_id` | TEXT (UNIQUE) | Clerk’s user ID (for webhook sync) |
| `email_hash` | TEXT (UNIQUE) | HMAC-SHA256(email, ENCRYPTION_MASTER_KEY) — never plaintext |
| `verified` | BOOLEAN | Email verification completed (synced from Clerk) |
| `created_at` | TIMESTAMPTZ | Auto-generated |

> **Note:** Passwords are managed entirely by Clerk.dev. Our database never stores passwords. The `email_hash` exists for our internal identity-separation logic, not for authentication.

#### `anonymous_profiles` — Public (without name)

| Column | Type | Notes |
|---|---|---|
| `token_id` | UUID (PK) | The anonymous token, referenced by all content |
| `display_name` | TEXT | Optional anonymous display name |
| `reputation_score` | INT | Increases with approved reports |
| `is_suspended` | BOOLEAN | Token-level suspension |
| `created_at` | TIMESTAMPTZ | Auto-generated |

#### `identity_links` — MAXIMUM SECRET

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Internal ID |
| `relation_proof` | TEXT | HMAC-SHA256(email_hash + token_id, ENCRYPTION_RELATION_KEY) |
| `created_at` | TIMESTAMPTZ | Auto-generated |

> **Note:** This table has NO direct FK to `users` or `anonymous_profiles`. The `relation_proof` is a one-way hash. Without BOTH `ENCRYPTION_MASTER_KEY` AND `ENCRYPTION_RELATION_KEY` (stored only in Cloudflare Secrets), it is mathematically impossible to determine which user owns which token.

#### `reports`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Report ID |
| `token_id` | UUID (FK → anonymous_profiles) | Anonymous author reference |
| `title` | TEXT | 10-200 characters |
| `body` | TEXT | 100-5000 characters |
| `category` | TEXT | Predefined category |
| `faculty` | TEXT | Faculty/department |
| `status` | TEXT | Draft/Under Review/Published/etc. |
| `votes` | INT | Anonymous vote counter |
| `search_vector` | TSVECTOR | Full-text search vector |
| `created_at` | TIMESTAMPTZ | Auto-generated |

#### `evidence`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Evidence ID |
| `report_id` | UUID (FK → reports) | Parent report |
| `file_key` | TEXT | Cloudinary public_id (UUID-based) |
| `file_type` | TEXT | MIME type (verified by magic number) |
| `file_size` | INT | Size in bytes |
| `uploaded_at` | TIMESTAMPTZ | Auto-generated |

#### `comments`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Comment ID |
| `report_id` | UUID (FK → reports) | Parent report |
| `token_id` | UUID (FK → anonymous_profiles) | Anonymous commenter |
| `parent_id` | UUID (FK → comments, nullable) | For 2-level nesting |
| `body` | TEXT | Max 1000 characters |
| `created_at` | TIMESTAMPTZ | Auto-generated |

#### `votes`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Vote ID |
| `report_id` | UUID (FK → reports) | Voted report |
| `token_id` | UUID (FK → anonymous_profiles) | Voter (anonymous) |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| **Constraint** | `UNIQUE(report_id, token_id)` | 1 vote per user per report |

#### `notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Notification ID |
| `token_id` | UUID (FK → anonymous_profiles) | Recipient |
| `type` | TEXT | state_change, new_evidence, moderator_response |
| `report_id` | UUID (FK → reports) | Related report |
| `message` | TEXT | Notification content (no personal data) |
| `read` | BOOLEAN | Read status |
| `created_at` | TIMESTAMPTZ | Auto-generated |

#### `moderation_log` — Immutable

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Log entry ID |
| `report_id` | UUID (FK → reports) | Moderated report |
| `moderator_token` | UUID | Moderator anonymous token |
| `action` | TEXT | approve/reject/request_info/escalate/edit |
| `reason` | TEXT | Mandatory for rejection |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| **Policy** | `NO UPDATE, NO DELETE` | Immutable audit trail |

#### `report_supporters` (Collaborative Reports)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Support ID |
| `report_id` | UUID (FK → reports) | Supported report |
| `token_id` | UUID (FK → anonymous_profiles) | Supporter |
| `description` | TEXT | Optional personal account |
| `created_at` | TIMESTAMPTZ | Auto-generated |

#### `tenants` (Multi-University, Post-v1.0)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Tenant ID |
| `name` | TEXT | University name |
| `email_domains` | TEXT[] | Allowed email domains |
| `config` | JSONB | Per-tenant configuration |
| `created_at` | TIMESTAMPTZ | Auto-generated |

### 7.2 Database Indexes

```sql
-- Full-text search (critical for < 500ms search)
CREATE INDEX idx_reports_search ON reports USING GIN(search_vector);

-- Feed queries
CREATE INDEX idx_reports_status ON reports(category, status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
CREATE INDEX idx_reports_faculty ON reports(faculty, status);

-- Relational lookups
CREATE INDEX idx_comments_report ON comments(report_id);
CREATE INDEX idx_evidence_report ON evidence(report_id);
CREATE UNIQUE INDEX idx_votes_unique ON votes(report_id, token_id);
```

---

## 8. Security Architecture — 6 Layers

| Layer | Technology | Protection |
|---|---|---|
| **Edge** | Cloudflare WAF + DDoS mitigation | Blocks volumetric attacks, bot traffic, known threats |
| **Network** | HTTPS TLS 1.3, HSTS max-age=31536000 | Encrypted transport, forces HTTPS |
| **Application** | Rate limiting, strict CORS, CSP headers | Prevents abuse, XSS, clickjacking |
| **Authentication** | JWT RS256 via Clerk (trust delegate), refresh token rotation | Secure identity verification. Clerk stores email; our DB only HMAC hash. |
| **Data** | HMAC-SHA256 for emails (irreversible without ENCRYPTION_MASTER_KEY), bcrypt passwords handled by Clerk | At-rest protection for sensitive data |
| **Files** | UUID filenames in Cloudinary, signed URLs with time-limited authentication tokens, metadata stripped on upload | No file metadata leakage, no permanent public URLs |

### Cryptographic Anonymity Flow (7 Steps)

```
1. User registers via Clerk.dev (email + password)
   → Clerk handles email verification, password hashing, JWT generation
   → Clerk stores email on THEIR infrastructure (trust boundary)

2. Clerk webhook fires `user.created` to our backend
   → Backend receives the verified email from Clerk

3. email_hash = HMAC-SHA256(email, ENCRYPTION_MASTER_KEY)
   ENCRYPTION_MASTER_KEY stored ONLY in Cloudflare Secrets
   email_hash is deterministic: same email → same hash (for lookup)
   BUT irreversible: cannot get email from hash without ENCRYPTION_MASTER_KEY

4. Store in `users` table: { email_hash }
   → NO PLAINTEXT EMAIL EXISTS IN OUR DATABASE

5. Generate anonymous_token = UUID v4 (cryptographic random)
   No relationship to email in its generation

6. Store in `anonymous_profiles` table: { token_id = anonymous_token }
   This is the user's public identity on the platform

7. relation_proof = HMAC-SHA256(email_hash + token_id, ENCRYPTION_RELATION_KEY)
   Store in `identity_links` table: { relation_proof }
   NO foreign keys to users or anonymous_profiles — just a one-way hash
```

**Result:** Three tables, zero direct relationships. Clerk has the email but not the anonymous token. Our DB has the token but not the email. The `identity_links` table connects them only via a one-way HMAC hash. Without BOTH `ENCRYPTION_MASTER_KEY` AND `ENCRYPTION_RELATION_KEY` (both in Cloudflare Secrets), the link is mathematically unbreakable.

---

## 9. Deployment Architecture

### 9.1 Environments

| Environment | Branch | Database | Deploy | Purpose |
|---|---|---|---|---|
| **Development** | `feature/*` | Neon dev branch | localhost | Individual development |
| **Staging** | `develop` | Neon staging branch | Auto-deploy on push | Integration testing |
| **Production** | `main` | Neon main branch | Manual approval required | Live users |

### 9.2 CI/CD Pipeline

```
Pull Request Opened
  ├── ESLint + Prettier check
  ├── TypeScript type-check (strict)
  ├── Unit tests (Vitest, >80% coverage)
  └── All must pass → PR can be merged

Push to `develop`
  ├── Auto-deploy to staging (Vercel preview + Workers staging)
  ├── Integration tests run
  └── Discord webhook notification

Merge to `main`
  ├── Production deploy
  ├── Manual approval gate
  ├── Health check after deploy
  ├── Automatic rollback if health check fails
  └── Discord webhook notification
```

### 9.3 Git Flow

| Branch | Purpose | Rules |
|---|---|---|
| `main` | Production code | Only via approved PR from `develop`. Protected. |
| `develop` | Integration branch | Only via approved PR from feature branches. |
| `feature/feature-name` | New features | Created from `develop`, merged via PR. |
| `fix/bug-name` | Bug fixes | Created from `develop`, merged via PR. |
| `hotfix/issue-name` | Critical production fixes | Only senior maintainers. Direct to `main` + backport to `develop`. |

---

## 10. Team Organization

| Sub-Team | Size | Responsibilities |
|---|---|---|
| **Frontend** | 4-5 | Next.js pages, components, Tailwind, responsive, accessibility |
| **Backend** | 4-5 | Hono.js endpoints, Drizzle ORM, business logic, Workers AI integration |
| **DevOps** | 2-3 | CI/CD, Cloudflare config, environment management, monitoring |
| **Security** | 2-3 | Auth implementation, crypto architecture, pen testing, DSS checklist |
| **QA** | 2-3 | Test suites, load testing, accessibility testing, documentation |

---

## 11. Code Standards

| Standard | Details |
|---|---|
| **Language** | TypeScript 5+ in strict mode, no `any` allowed |
| **Linting** | ESLint with strict config, Prettier for formatting, both mandatory in CI |
| **Commits** | Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`) |
| **Documentation** | JSDoc for all public functions, OpenAPI/Swagger per release |
| **Testing** | Vitest, minimum 80% backend coverage, integration tests for critical flows |
| **PRs** | Max 400 lines changed, minimum 1 reviewer (2 for security-related), linked to issue |
| **Development** | Docker Compose for uniform environment, `.env.example` versioned (never real values) |

---

## 12. Technical Roadmap

| Phase | Duration | Deliverable |
|---|---|---|
| **Phase 0: Setup** | 1-2 weeks | Repo, CI/CD, Docker, all external services configured |
| **Phase 1: MVP Auth** | 2-3 weeks | Registration, login, anonymous token, JWT, security headers |
| **Phase 2: MVP Reports** | 3-4 weeks | Report CRUD, evidence upload, metadata stripping, AI filter, search |
| **Phase 3: Moderation** | 2-3 weeks | Moderation panel, human review, audit trail, publication delay |
| **Phase 4: Social** | 2-3 weeks | Comments, votes, collaborative reports, notifications |
| **Phase 5: Admin** | 2 weeks | Statistics dashboard, role management |
| **Phase 6: QA & Hardening** | 2-3 weeks | Load testing, pen testing, accessibility, documentation, launch |
