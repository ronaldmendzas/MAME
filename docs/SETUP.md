# Environment Setup Guide

> **MAME v2.0** — Step-by-Step Configuration of All External Services
>
> *Synthesized from: `MAME_Setup_Guide (2).pdf` (Setup v1.0, 16 pages)*

---

## Overview

MAME runs entirely on free-tier services. Total cost: **$0 USD**.

| # | Service | Purpose | Free Tier | CC Required? |
|---|---|---|---|---|
| 1 | GitHub | Source code, CI/CD, project management | Unlimited public repos, 2000 CI min/mo | **NO** |
| 2 | Neon.tech | PostgreSQL database (serverless) | 500MB storage, branching, pgBouncer | **NO** |
| 3 | Cloudflare | Workers (backend), KV (cache), AI, Queues | 100K req/day, Workers AI | **NO** |
| 4 | Clerk.dev | Authentication, JWT, roles | 50,000 MRU (Monthly Retained Users) | **NO** |
| 5 | Vercel | Frontend hosting (Next.js) | 100GB bandwidth/mo | **NO** |
| 6 | Resend.com | Transactional email | 3,000 emails/month | **NO** |
| 7 | Cloudinary | **PRIMARY evidence file storage** | 25 credits/mo (≈25GB combined). **No CC.** | **NO** |
| 8 | Sentry.io | Error monitoring | 5,000 errors/month, 1 user | **NO** |

> **✅ ZERO CREDIT CARD REQUIRED.** Every service above works with NO payment method. This was a hard design requirement.

---

## Service 1 — GitHub

### Setup Steps

1. **Create account** at [github.com](https://github.com) (if not existing)
2. **Create organization:**
   - Settings → Organizations → New Organization
   - Name: `mame-foro` (or your chosen name)
   - Plan: **Free**
3. **Invite team members:**
   - Organization → People → Invite member
   - Invite all 15+ students by GitHub username or email
   - Assign roles: Owner (2-3 leads), Member (everyone else)
4. **Create repository:**
   - Organization → Repositories → New
   - Name: `mame-app`
   - Visibility: Private (initially, public after launch)
   - Initialize with: README, `.gitignore` (Node template)
5. **Configure branch protection:**
   - Settings → Branches → Add rule
   - Branch: `main` — Require PR, require 2 approvals, require status checks
   - Branch: `develop` — Require PR, require 1 approval

### Result

```
Repository: https://github.com/mame-foro/mame-app
Organization: mame-foro (Free plan)
Team: 15+ members invited
Branches: main (protected) + develop (protected)
```

---

## Service 2 — Neon.tech (PostgreSQL)

### Setup Steps

1. **Create account** at [neon.tech](https://neon.tech)
   - Recommended: **Continue with GitHub** (links to your GitHub account)
2. **Create project:**
   - Project name: `mame-production`
   - Database name: `mame_db`
   - PostgreSQL version: **16**
   - Region: `us-east-1` (or `sa-east-1` for South America — choose closest to users)
3. **⚠️ CRITICAL: Copy connection string immediately**
   - The full connection string is shown only once at creation
   - Format: `postgresql://user:password@host.neon.tech/mame_db?sslmode=require`
   - Save it in a secure password manager RIGHT NOW
4. **Create database branches:**
   - Dashboard → Branches → Create Branch
   - Create: `development` (from main)
   - Create: `staging` (from main)
   - Each branch has its own connection string — save all three
5. **Save 3 connection strings:**
   - `DATABASE_URL_PRODUCTION` = main branch connection string
   - `DATABASE_URL_STAGING` = staging branch connection string
   - `DATABASE_URL_DEVELOPMENT` = development branch connection string

### Initial Database Schema

Run this SQL in the Neon SQL Editor for the `main` branch:

```sql
-- Core identity table (MAXIMUM SECRET)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT UNIQUE NOT NULL,
    email_hash TEXT UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public anonymous profiles
CREATE TABLE anonymous_profiles (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT,
    reputation_score INT DEFAULT 0,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Identity link (MAXIMUM SECRET - ultra restricted access)
CREATE TABLE identity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relation_proof TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID REFERENCES anonymous_profiles(token_id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    faculty TEXT,
    status TEXT DEFAULT 'pending',
    votes INT DEFAULT 0,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX idx_reports_search ON reports USING GIN(search_vector);

-- Auto-populate search_vector on INSERT or UPDATE
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.body, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.faculty, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_search_update
  BEFORE INSERT OR UPDATE OF title, body, category, faculty
  ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- Feed performance indexes
CREATE INDEX idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX idx_reports_category ON reports(category, status);
CREATE INDEX idx_reports_faculty ON reports(faculty, status);

-- Evidence files
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    file_key TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_report ON evidence(report_id);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    token_id UUID REFERENCES anonymous_profiles(token_id),
    parent_id UUID REFERENCES comments(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_report ON comments(report_id);

-- Votes
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    token_id UUID REFERENCES anonymous_profiles(token_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, token_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID REFERENCES anonymous_profiles(token_id),
    type TEXT NOT NULL,
    report_id UUID REFERENCES reports(id),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation log (IMMUTABLE - no UPDATE or DELETE)
CREATE TABLE moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    moderator_token UUID NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce immutability: prevent UPDATE and DELETE on moderation_log
CREATE RULE no_update_moderation AS ON UPDATE TO moderation_log DO INSTEAD NOTHING;
CREATE RULE no_delete_moderation AS ON DELETE TO moderation_log DO INSTEAD NOTHING;

-- Collaborative report supporters
CREATE TABLE report_supporters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    token_id UUID REFERENCES anonymous_profiles(token_id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community flags/reports
CREATE TABLE report_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    token_id UUID REFERENCES anonymous_profiles(token_id),
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Result

```
Project: mame-production
Database: mame_db (PostgreSQL 16)
Region: us-east-1
Branches: main + development + staging
Connection strings: 3 saved securely
Tables: 10+ created with indexes
```

---

## Service 3 — Cloudflare

### Setup Steps

1. **Create account** at [cloudflare.com](https://cloudflare.com) → Free plan
2. **Enable Workers:**
   - Workers & Pages → Overview → Create your first Worker
   - Subdomain: `mame-backend` → Result: `mame-backend.workers.dev`
3. **Create KV Namespaces:**
   - Workers & Pages → KV → Create a namespace
   - Create: `MAME_CACHE` (for feed cache, rate limit counters)
   - Create: `MAME_SESSIONS` (for session data)
   - **Note the Namespace IDs** — needed for `wrangler.toml`
4. **⚠️ R2 NOT used as primary storage** (requires credit card verification):
   - Cloudflare R2 requires a credit card on file even for the free tier.
   - **Primary evidence storage uses Cloudinary instead** (see Service 7).
   - If a team member CAN provide a CC later, R2 can be added as optional upgrade:
     - R2 → Create bucket → `mame-evidencias` → 10GB free, zero egress.
5. **Workers AI** — Already available by default on Workers plan
   - Models available:
     - `@cf/meta/llama-guard-3-8b` — Content safety classification
     - `@cf/meta/llama-3.2-11b-vision-instruct` — Multimodal image analysis
6. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   wrangler --version
   wrangler login
   ```
   - `wrangler login` opens browser for OAuth authentication

### wrangler.toml Configuration

```toml
name = "mame-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "MAME_CACHE"
id = "<your-kv-cache-id>"

[[kv_namespaces]]
binding = "MAME_SESSIONS"
id = "<your-kv-sessions-id>"

# NOTE: R2 NOT used by default (requires credit card).
# Evidence files stored in Cloudinary (no CC required).
# Uncomment below ONLY if a team member adds a CC to Cloudflare:
# [[r2_buckets]]
# binding = "EVIDENCE_BUCKET"
# bucket_name = "mame-evidencias"

[ai]
binding = "AI"

[[queues.producers]]
binding = "PUBLICATION_QUEUE"
queue = "mame-publication-delay"

[[queues.consumers]]
queue = "mame-publication-delay"
max_batch_size = 10
max_batch_timeout = 30
```

### Result

```
Workers subdomain: mame-backend.workers.dev
KV Namespaces: MAME_CACHE + MAME_SESSIONS (IDs noted)
R2 Bucket: NOT USED (requires CC) — Cloudinary is primary storage
Workers AI: Available (Llama Guard 3 + Llama 3.2 Vision)
Wrangler CLI: Installed and authenticated
```

---

## Service 4 — Clerk.dev (Authentication)

### Setup Steps

1. **Create account** at [clerk.dev](https://clerk.dev)
   - Recommended: **Continue with GitHub**
2. **Create application:**
   - Application name: `MAME`
   - Sign-in methods: **Email address** (required) + optionally Google and GitHub
3. **Save API Keys immediately:**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  (public, safe for frontend)
   CLERK_SECRET_KEY=sk_test_...                    (PRIVATE, backend only)
   ```
4. **Configure user roles:**
   - Dashboard → User & Authentication → Roles
   - Create roles: `user`, `moderator`, `admin`
5. **Configure JWT Templates:**
   - Dashboard → JWT Templates → Create template
   - Template name: `mame-token`
   - Start from: Blank
   - Add custom claims as needed (role, token_id)
6. **Configure Redirect URLs:**
   - Sign-in URL: `/iniciar-sesion`
   - Sign-up URL: `/registro`
   - After sign-in URL: `/feed`
   - After sign-up URL: `/bienvenida`
   - After sign-out URL: `/`
7. **Configure Webhooks (for DB sync):**
   - Dashboard → Webhooks → Add endpoint
   - URL: `https://mame-backend.workers.dev/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`, `session.created`
   - Save webhook signing secret

### Result

```
Application: MAME
Auth: Email (+ optional Google/GitHub)
Roles: user, moderator, admin
JWT: RS256 with custom claims
Webhooks: Configured for user lifecycle events
Free tier: 50,000 MRU (no credit card required)
```

---

## Service 5 — Vercel (Frontend Hosting)

### Setup Steps

1. **Login** at [vercel.com](https://vercel.com) with GitHub
2. **Create project:**
   - Add New → Project
   - Import: Select `mame-app` repository from `mame-foro` organization
   - Framework: **Next.js** (auto-detected)
3. **Add environment variables BEFORE first deploy:**
   - Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
     CLERK_SECRET_KEY = sk_test_...
     NEXT_PUBLIC_API_URL = https://mame-backend.workers.dev
     NEXT_PUBLIC_SENTRY_DSN = https://...@sentry.io/...
     ```
4. **Deploy** — Click "Deploy" button (takes 1-3 minutes)
5. **Verify:**
   - Production URL: `https://mame-app.vercel.app`
   - Auto-deploy on push to `main` branch
   - Preview deployments created for every PR/branch

### Result

```
URL: https://mame-app.vercel.app
Auto-deploy: On push to main
Preview deploys: Per branch/PR
Environment variables: 4 configured
Free tier: 100GB bandwidth/month
```

---

## Service 6 — Resend.com (Email)

### Setup Steps

1. **Create account** at [resend.com](https://resend.com)
2. **Create API Key:**
   - API Keys → Create API Key
   - Name: `MAME Production`
   - Permission: Full access
3. **⚠️ Copy API key immediately** (shown only once):
   ```
   RESEND_API_KEY=re_...
   ```
4. **Optional — Configure custom domain:**
   - Domains → Add Domain
   - Adds DNS records for better email deliverability
   - Not required for development, recommended for production

### Result

```
API Key: RESEND_API_KEY saved
Free tier: 3,000 emails/month
Use case: Verification codes, password reset, notifications
```

---

## Service 7 — Cloudinary (PRIMARY Evidence Storage)

> **Cloudinary is the PRIMARY file storage for evidence files.** Free forever, NO credit card required. 25 monthly credits (≈25GB of combined storage + bandwidth + transformations). This was chosen over Cloudflare R2 because R2 requires credit card verification.

### Setup Steps

1. **Create account** at [cloudinary.com](https://cloudinary.com) — **No credit card required**
2. **Dashboard — Save credentials:**
   ```
   CLOUDINARY_CLOUD_NAME = your-cloud-name
   CLOUDINARY_API_KEY = 123456789012345
   CLOUDINARY_API_SECRET = abc...xyz
   ```
3. **Create folder structure:**
   - Media Library → Create folder: `mame-evidencias`
   - Inside, create subfolders:
     - `imagenes`
     - `videos`
     - `documentos`
4. **Configure authenticated delivery (signed URLs):**
   - Settings → Security → Enable "Strict transformations"
   - This ensures all evidence URLs require a signature (time-limited) — no permanent public access
5. **Configure upload presets:**
   - Settings → Upload → Add upload preset
   - Name: `mame-evidence`
   - Signing Mode: **Signed** (requires API secret)
   - Folder: `mame-evidencias`
   - Flags: `strip_profile` (auto-strip EXIF/metadata on upload)
   - Resource type: `auto` (supports images, videos, PDFs)

### Result

```
Cloud name: CLOUDINARY_CLOUD_NAME saved
API credentials: Key + Secret saved
Folder structure: mame-evidencias/{imagenes,videos,documentos}
Authenticated delivery: Enabled (signed URLs required)
Upload preset: mame-evidence (signed, strip_profile)
Free tier: 25 credits/mo (~25GB combined). No CC required.
```

---

## Service 8 — Sentry.io (Error Monitoring)

### Setup Steps

1. **Create account** at [sentry.io](https://sentry.io) with GitHub
2. **Create organization:**
   - Name: `mame-foro`
   - Plan: **Developer** (free — 5,000 errors/month, **1 user limit**)
   - **Note:** Only 1 team member gets Sentry dashboard access. Designate DevOps lead.
3. **Create Project 1 (Frontend):**
   - Platform: **Next.js**
   - Project name: `mame-frontend`
   - Save DSN:
     ```
     NEXT_PUBLIC_SENTRY_DSN=https://...@o123456.ingest.sentry.io/...
     ```
4. **Create Project 2 (Backend):**
   - Platform: **JavaScript** (for Cloudflare Workers)
   - Project name: `mame-backend`
   - Save DSN:
     ```
     SENTRY_DSN_BACKEND=https://...@o123456.ingest.sentry.io/...
     ```
5. **Configure data scrubbing:**
   - Settings → Security & Privacy → Data Scrubbing
   - Enable: Scrub data, scrub IP addresses
   - Add custom scrub rules: `email`, `token`, `password`
   - **CRITICAL:** Sentry must NEVER capture personal data (emails, tokens) in error reports

### Result

```
Organization: mame-foro (Developer plan)
Frontend DSN: NEXT_PUBLIC_SENTRY_DSN saved
Backend DSN: SENTRY_DSN_BACKEND saved
Data scrubbing: Configured to exclude personal data
Free tier: 5,000 events/month
```

---

## Complete Environment Variables Summary

### Frontend (Vercel)

| Variable | Source | Public? |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk.dev Dashboard | Yes (public) |
| `CLERK_SECRET_KEY` | Clerk.dev Dashboard | **NO — server only** |
| `NEXT_PUBLIC_API_URL` | Your Workers URL | Yes (public) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Dashboard | Yes (public) |

### Backend (Cloudflare Workers)

| Variable | Source | Storage |
|---|---|---|
| `DATABASE_URL` | Neon.tech Dashboard | Cloudflare Secrets |
| `CLERK_SECRET_KEY` | Clerk.dev Dashboard | Cloudflare Secrets |
| `CLERK_WEBHOOK_SECRET` | Clerk.dev Webhooks | Cloudflare Secrets |
| `RESEND_API_KEY` | Resend Dashboard | Cloudflare Secrets |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard | wrangler.toml [vars] |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard | Cloudflare Secrets |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard | Cloudflare Secrets |
| `SENTRY_DSN_BACKEND` | Sentry Dashboard | wrangler.toml [vars] |
| `ENCRYPTION_MASTER_KEY` | Self-generated | **Cloudflare Secrets ONLY** |
| `ENCRYPTION_RELATION_KEY` | Self-generated | **Cloudflare Secrets ONLY** |

### Generating Encryption Keys

```bash
# Generate ENCRYPTION_MASTER_KEY (64+ characters, cryptographically random)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate ENCRYPTION_RELATION_KEY (64+ characters, cryptographically random)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **⚠️ CRITICAL WARNING:**
> - These two keys protect the anonymity of every user on the platform
> - If `ENCRYPTION_MASTER_KEY` is lost: email hash lookups break (can’t verify HMAC hashes for new Clerk webhook events)
> - If `ENCRYPTION_RELATION_KEY` is lost: identity linking becomes permanently impossible
> - Store backup copies in a team password manager (e.g., 1Password, Bitwarden)
> - NEVER commit these to Git, NEVER put in `.env` files, NEVER put in the database
> - Store ONLY in Cloudflare Secrets (encrypted at rest)

### Setting Cloudflare Secrets

```bash
# Set each secret via Wrangler CLI
wrangler secret put DATABASE_URL
# Paste the Neon connection string when prompted

wrangler secret put CLERK_SECRET_KEY
# Paste the Clerk secret key when prompted

wrangler secret put CLERK_WEBHOOK_SECRET
# Paste the webhook signing secret when prompted

wrangler secret put RESEND_API_KEY
# Paste the Resend API key when prompted

wrangler secret put CLOUDINARY_API_KEY
# Paste when prompted

wrangler secret put CLOUDINARY_API_SECRET
# Paste when prompted

wrangler secret put ENCRYPTION_MASTER_KEY
# Paste the generated 128-char hex string when prompted

wrangler secret put ENCRYPTION_RELATION_KEY
# Paste the generated 128-char hex string when prompted
```

---

## Final Verification Checklist

| # | Service | Account Created | Credentials Saved | Env Variable Configured |
|---|---|---|---|---|
| 1 | GitHub | ☐ | N/A | N/A |
| 2 | Neon.tech | ☐ | ☐ 3 connection strings | ☐ DATABASE_URL |
| 3 | Cloudflare Workers | ☐ | ☐ Account dashboard | ☐ wrangler.toml |
| 4 | Cloudflare KV | ☐ | ☐ 2 namespace IDs | ☐ wrangler.toml |
| 5 | Cloudinary | ☐ | ☐ 3 credentials (cloud name, key, secret) | ☐ Workers vars/secrets |
| 6 | Clerk.dev | ☐ | ☐ 2 API keys + webhook secret | ☐ Vercel + Workers |
| 7 | Vercel | ☐ | ☐ Deploy URL | ☐ 4 env vars |
| 8 | Resend.com | ☐ | ☐ API key | ☐ Workers secret |
| 9 | Sentry.io | ☐ | ☐ 2 DSNs | ☐ Frontend + Backend |
| 11 | Encryption Keys | ☐ Generated | ☐ Password manager | ☐ Workers secrets |

---

## Quick Start — Local Development

After all services are configured:

```bash
# 1. Clone the repository
git clone https://github.com/mame-foro/mame-app.git
cd mame-app

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local
# Edit .env.local with your development credentials

# 4. Start local database (Docker)
docker compose up -d

# 5. Run database migrations
npx drizzle-kit push

# 6. Start frontend (Next.js)
cd apps/web
npm run dev
# → http://localhost:3000

# 7. Start backend (Cloudflare Workers)
cd apps/api
wrangler dev
# → http://localhost:8787
```

### Docker Compose Template

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: mame_db
      POSTGRES_USER: mame_user
      POSTGRES_PASSWORD: local_dev_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

> **Note:** Local Docker Postgres is for development only. Staging and production use Neon.tech branches.
