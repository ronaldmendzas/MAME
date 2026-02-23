# MAME — Movimiento Autónomo de Momentos con Estudiantes

> **Anonymous University Social Network for Academic Transparency & Whistleblowing**

---

## What is MAME?

MAME is a **web platform** where any university student can **anonymously** report academic corruption, harassment, plagiarism, discrimination, nepotism, administrative fraud, and other institutional irregularities — backed by **mandatory evidence** and protected by **cryptographic anonymity**.

Unlike WhatsApp groups or conventional social media, MAME guarantees **real cryptographic anonymity**: even an administrator with full database access **cannot** link a report to the reporter's identity. The relationship between a user's email and their anonymous token is protected by HMAC-SHA256 hashing with master keys stored exclusively in Cloudflare Secrets — never in the database.

MAME is not just a complaint box. It is a **full social network**: users can publish, comment, vote, join collaborative reports ("I experienced this too"), and follow threads — all anonymously.

> **Clerk Trust Boundary:** Authentication is delegated to Clerk.dev (SOC 2 Type II compliant). Clerk stores emails on their infrastructure. Our database **never** contains plaintext emails — only HMAC-SHA256 hashes. This is a deliberate security tradeoff: using a battle-tested auth provider eliminates the #1 vulnerability in student projects (custom auth). Even if our entire database is breached, emails cannot be extracted. Compromising Clerk alone does not reveal which email maps to which anonymous token. Both systems must be compromised simultaneously AND both encryption keys must be obtained to break anonymity.

---

## Core Principles

| Principle | What It Means | How It's Guaranteed |
|---|---|---|
| **Real Anonymity** | The system technically CANNOT reveal who reported | Cryptographic separation between identity and actions (HMAC-SHA256 + UUID v4 + ENCRYPTION_MASTER_KEY/ENCRYPTION_RELATION_KEY in Cloudflare Secrets) |
| **Mandatory Evidence** | No evidence = no report. Period. | Backend rejects any submission without at least 1 attached file |
| **Zero Cost** | Entire infrastructure runs on free tiers ($0 USD/month). **No credit card required for any service.** | Stack selected specifically for generous free tiers that require NO payment method |
| **Dual Moderation** | AI auto-filter + human review before anything goes public | Workers AI blocks illegal content; moderators review everything else |
| **Multi-University** | Multi-tenant architecture ready to scale across institutions | Tenant isolation by design, configurable email domains per tenant |

---

## Tech Stack

### Frontend
| Technology | Role | Why This Choice |
|---|---|---|
| **Next.js 15** (App Router) | Frontend framework | SSR for SEO on public reports, React Server Components reduce client JS, file-based routing, deployed on **Cloudflare Pages** (unlimited bandwidth) |
| **TypeScript** (strict mode) | Language | Shared types frontend↔backend, autocompletion for 15+ devs, eliminates entire class of bugs |
| **Tailwind CSS** | Styling | Utility-first eliminates CSS naming conflicts in large teams, purged CSS < 10KB in production |
| **Zod** | Validation | Type-safe runtime validation, same schemas shared between frontend and backend |

### Backend
| Technology | Role | Why This Choice |
|---|---|---|
| **Cloudflare Workers** | Backend runtime | Edge computing on 300+ global locations, 0ms cold start, 100K req/day free (shared with Pages Functions). Used for write operations, AI, queues. No CC. |
| **Hono.js** | Backend framework | Ultra-lightweight (<15KB), edge-native, TypeScript-first, Express-like API for easy team onboarding |
| **Drizzle ORM** | Database ORM | Native prepared statements (SQL injection proof), versioned migrations, better perf than Prisma |

### Data & Storage
| Technology | Role | Why This Choice |
|---|---|---|
| **Neon PostgreSQL** (serverless) | Primary database | Serverless autoscaling, sleeps when idle, native full-text search, DB branching for dev/staging/prod. 500MB free. **No CC required.** |
| **Cloudinary** | Evidence file storage | 25 credits/month free (1 credit = 1GB storage OR 1GB bandwidth OR 1K transforms — shared pool). **NO credit card.** Served through **Cloudflare CDN proxy** to minimize bandwidth credits. |
| **Cloudflare KV** | Distributed cache | Global key-value store, microsecond reads, 100K reads/day + 1K writes/day free. Used with write batching. **No CC.** |
| **Cloudflare Queues** | Task queues | Publication delay (anti-timing), async moderation pipeline, automatic retry. **No CC.** |

### Auth, Security & AI
| Technology | Role | Why This Choice |
|---|---|---|
| **Clerk.dev** | Authentication (trust delegate) | **50K MRU free (Monthly Retained Users), NO credit card required.** SOC 2 Type II, pre-built UI components for Next.js, JWT RS256 + refresh tokens, email verification, roles, webhooks, GDPR compliant. **Note:** Clerk stores emails on their servers — our DB only stores HMAC hashes. See trust boundary docs. |
| **Workers AI** | Content moderation | AI models run directly on the edge (no data leaves Cloudflare). Models: Llama Guard 3 for content safety classification, Llama 3.2 Vision for image analysis. NSFW/illegal content detection before storage. |

### DevOps & Monitoring
| Technology | Role | Why This Choice |
|---|---|---|
| **Resend.com** | Critical admin email only | Clerk handles auth emails (verification, reset). Resend only for admin alerts. 3,000/month free. All user notifications are in-app (notification bell). |
| **Sentry.io** | Error monitoring | Real-time error tracking (excludes personal data), 5K errors/month free, 1 user. **No CC required.** |
| **GitHub Actions** | CI/CD | Lint + type-check + tests on every PR; auto-deploy staging on `develop`; manual approval for production |
| **Cloudflare Pages** | Frontend hosting | **Unlimited bandwidth** (free), auto-deploy on push, preview deployments per branch. Replaces Vercel (which caps at 100GB/month). **No CC.** |

---

## System Capacity Targets (4-Month Free Phase)

**Scenario:** 50K registered accounts over 4 months, ~10K DAU by month 4, ~750 reports/day with 80% media.

| Metric | Target | Free Tier Strategy |
|---|---|---|
| Registered users | 50,000 in 4 months | Clerk: 50K MRU free. Hits exact limit at month 4 — upgrade with funding in month 5. |
| Daily active users | 10,000 DAU (month 4) | Aggressive ISR/SSG caching reduces actual function invocations from ~200K to **~25K/day** (80%+ cache hit rate). Fits within 100K/day shared Workers+Pages limit. |
| Peak concurrency | ~275 simultaneous (11am weekday) | University traffic pattern: <2% of DAU at any moment. ISR serves cached pages, only writes hit live functions. |
| Daily publications | 500–1,000 reports/day + 3,750 comments + 7,500 votes | **Client-side compression** (images ≤200KB WebP, video clips ≤10sec/500KB) keeps Cloudinary at ~22 of 25 credits in month 4. |
| API response time | < 200ms (P95) | Workers edge + Neon pgBouncer + ISR cache. Read paths served from Cloudflare CDN. |
| Page load (first, 4G) | < 2 seconds | Cloudflare Pages global CDN + Next.js SSR/ISR |
| Page load (cached) | < 500ms | ISR pages cached at 300+ Cloudflare edge locations |
| Full-text search | < 500ms with 90K records | GIN indexes on Neon (search_vector). DB ~430MB/500MB by month 4 — tight but feasible with TOAST compression. |
| Evidence upload limit | 5MB/file after client compression | Client-side: images → WebP ≤200KB, videos → 10sec ≤500KB, audio → 60sec ≤300KB, PDFs ≤ 2MB. Originals never reach server. |
| Cloudinary month 4 | ~22 of 25 credits used | Storage ~18GB + CDN-proxied bandwidth ~4 credits + 0 transforms (all client-side). |
| Neon month 4 | ~430 of 500MB used | ~90K reports + ~450K comments + 50K users + indexes. TOAST compresses long text automatically. |
| LCP (Lighthouse) | < 2.5 seconds on simulated 4G | Static ISR pages + Cloudflare CDN = fast LCP globally. |
| Annual uptime | 99.5% (max 43h downtime/year) | Cloudflare/Neon/Clerk all >99.9% uptime SLAs. |
| RTO / RPO | < 2 hours / max 1 hour | Neon branching + automatic backups. |

### How 10K DAU Fits in 100K req/day (Caching Strategy)

```
Without caching:  10K DAU × 20 req/session = 200K req/day  → ❌ Exceeds 100K
With ISR caching:  80% reads served from CDN cache
  Dynamic requests: 10K × 20 × 0.20 = 40K
  + Queue/AI workers: ~3K
  + ISR revalidation: ~2.5K
  TOTAL function invocations: ~45K/day  → ✅ Within 100K
```

### How 18K Files/Month Fits in 25 Cloudinary Credits

```
Client-side compression eliminates server transforms (0 credits):
  Images:  browser Canvas API → WebP ≤200KB + EXIF stripped via piexifjs
  Videos:  browser MediaRecorder → 10sec ≤500KB (longer → external YouTube/Drive link)
  Audio:   browser MediaRecorder → 60sec ≤300KB
  PDFs:    browser pdf-lib → metadata stripped + ≤2MB

Cloudflare CDN proxy eliminates most bandwidth credits:
  Worker proxies Cloudinary URLs → Cloudflare Cache API (24h TTL)
  First access: hits Cloudinary (counts as bandwidth)
  Repeat access: served from Cloudflare edge (FREE, unlimited)
  Cache hit rate: ~90%+ for popular content

Month 4 credit breakdown:
  Storage:     ~18GB cumulative = 18 credits
  Bandwidth:   ~4GB (only cache misses reach Cloudinary) = 4 credits
  Transforms:  0 (all client-side)
  TOTAL:       ~22 credits / 25 limit ✅
```

> **100% Free for 4 Months — Zero Credit Card Required.** Every service selected for generous free tiers with NO payment method. After month 4 with funding: upgrade Clerk ($25+), add Cloudflare R2 for storage ($0 with CC), scale Workers ($5). Hexagonal architecture enables service-by-service upgrades without rewriting business logic.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                        │
│            WAF · DDoS Protection · CDN · Rate Limiting    │
└───────────────┬──────────────────┬───────────────────────┘
                │                  │
     ┌──────────▼──────┐  ┌───────▼─────────────┐
     │ CLOUDFLARE PAGES │  │  CLOUDFLARE WORKERS  │
     │  Next.js 15 ISR  │  │  Hono.js REST API    │
     │  (Frontend+CDN)  │  │  (Backend+AI+Queues) │
     └──────────┬──────┘  └───────┬─────────────┘
                │                  │
     ┌──────────▼──────┐          │
     │    CLERK.DEV     │          │
     │  Auth · JWT RS256│          │
     │  Roles · MFA     │          │
     └─────────────────┘          │
                     ┌────────────┼──────────────┐
                     │            │              │
            ┌────────▼──┐  ┌─────▼──────┐ ┌─────▼──────┐
            │ NEON.TECH  │  │ CLOUDINARY │ │CLOUDFLARE  │
            │ PostgreSQL │  │ Evidence   │ │  KV+Queues │
            │ Full-text  │  │ Storage    │ │Cache+Delay │
            │ Search     │  │ (No CC!)   │ │            │
            └───────────┘  └────────────┘ └────────────┘
```

**Architecture style**: Hexagonal (Ports & Adapters) + Serverless + Event-Driven for moderation pipeline. See [Architecture doc](docs/ARCHITECTURE.md) for full details.

---

## Team

| Attribute | Value |
|---|---|
| **Size** | 15+ engineering/CS students |
| **Methodology** | Scrum adapted with 2-3 week sprints |
| **Project Management** | GitHub Projects (integrated with repo) |
| **Total Duration** | 11 weeks (~3 months), 4 sprints |
| **Weekly Ceremony** | 30-minute sync meeting |
| **Velocity** | 40-60 story points per sprint |
| **Definition of Done** | Feature with tests + PR approved by 2+ reviewers + deployed to staging + documented |

### Sub-Teams
| Team | Responsibility | Size |
|---|---|---|
| **Frontend Core** | Next.js, components, UI/UX, accessibility | 4-5 |
| **Backend Core** | Hono.js, endpoints, business logic, security | 4-5 |
| **Data & DevOps** | DB schema, migrations, CI/CD, monitoring, Docker | 2-3 |
| **Moderation & AI** | Content pipeline, Workers AI, moderation panel | 2-3 |
| **QA & Docs** | Tests, API documentation (Swagger), SRS updates | 2-3 |

---

## Code Standards (Mandatory for All Team Members)

- TypeScript strict mode: `strict: true` in tsconfig, no implicit `any`
- ESLint + Prettier configured in repo; CI pipeline rejects non-formatted code
- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- JSDoc on every public function with description, params, return type
- Every new feature must include unit tests (Vitest)
- PRs max 400 lines of changes (larger PRs are rejected)
- Minimum 1 reviewer for merge; security PRs require 2 reviewers
- Docker Compose for uniform development environment across all 15+ students
- `.env.example` versioned in repo (never real values)

---

## Documentation Index

| Document | Description | Link |
|---|---|---|
| **SRS — Requirements** | All functional & non-functional requirements, business rules, MVP acceptance criteria | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) |
| **SAD — Architecture** | System architecture, design patterns, data model, tech stack justifications, CI/CD pipeline, team standards, rejected alternatives | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **DSS — Security** | STRIDE threat model, cryptographic anonymity flow, 6 security layers, incident response plan, legal identity request protocol, 24-item pre-launch checklist | [docs/SECURITY.md](docs/SECURITY.md) |
| **Sprint Plan** | 4 sprints, 22 user stories with points & criteria, all technical tasks, Definition of Done per sprint, version plan, post-v1.0 roadmap | [docs/SPRINTS.md](docs/SPRINTS.md) |
| **Setup Guide** | Step-by-step infrastructure configuration for all 8 services, SQL for initial tables, env variables list, final verification checklist | [docs/SETUP.md](docs/SETUP.md) |

---

## Project Constraints

| Constraint | Description | Impact |
|---|---|---|
| **Budget** | $0 USD. Entire stack must be 100% free tier. **No credit card required for any service.** | Limits infrastructure options; all services chosen for free tier generosity AND zero CC requirement |
| **Team** | 15+ students with varying experience levels | Requires standardized code, TypeScript strict, Docker, documentation |
| **Time** | University project with academic deadlines | MVP first, advanced features later; 11 weeks total |
| **Legal** | Cannot identify users without court order | Anonymity architecture is non-negotiable; identity reveal requires 2 founder approvals + both master keys |
| **Content** | Cannot host illegal content under any circumstance | Automatic AI moderation is mandatory before any human sees uploaded content |
| **Infrastructure** | Only services with robust free tiers and NO credit card requirement | Cloudflare (Workers/KV/Queues/AI), Vercel, Neon.tech, Clerk.dev, Cloudinary, Resend, Sentry |

---

## Quick Start

1. Read the **[Setup Guide](docs/SETUP.md)** — Configure all 8 services (accounts, API keys, databases)
2. Read the **[Requirements](docs/REQUIREMENTS.md)** — Understand WHAT to build
3. Read the **[Architecture](docs/ARCHITECTURE.md)** — Understand HOW to build it
4. Read the **[Security](docs/SECURITY.md)** — **MANDATORY before writing any code**
5. Follow the **[Sprint Plan](docs/SPRINTS.md)** — Know WHAT to work on and WHEN

---

> **MAME** — Because academic transparency shouldn't require sacrificing your future.
