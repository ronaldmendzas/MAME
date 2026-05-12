# Coding Standards & Project Conventions

> **MAME** — Rules every file in this repository MUST follow.
> Reference this document before writing or reviewing any code.

---

## 1. Language & Naming

| Rule                 | Standard                                                                |
| -------------------- | ----------------------------------------------------------------------- |
| **Code language**    | English ONLY — variables, functions, classes, types, file names         |
| **Docs language**    | English (except CREDENTIALS.md which is local-only)                     |
| **Variables**        | `camelCase` — `reportCount`, `tokenId`, `emailHash`                     |
| **Functions**        | `camelCase` — `createReport`, `validateEvidence`, `hashEmail`           |
| **Types/Interfaces** | `PascalCase` — `Report`, `AnonymousProfile`, `CreateReportInput`        |
| **Enums**            | `PascalCase` type, `UPPER_SNAKE` values — `ReportStatus.UNDER_REVIEW`   |
| **Files**            | `kebab-case.ts` — `create-report.ts`, `auth-middleware.ts`              |
| **Folders**          | `kebab-case` — `report-service/`, `auth-middleware/`                    |
| **Constants**        | `UPPER_SNAKE_CASE` — `MAX_FILE_SIZE`, `JWT_EXPIRY_SECONDS`              |
| **Booleans**         | Prefix with `is`, `has`, `can`, `should` — `isPublished`, `hasEvidence` |
| **DB columns**       | `snake_case` — `token_id`, `email_hash`, `created_at`                   |

---

## 2. File & Function Size Limits

| Rule                            | Limit                                            |
| ------------------------------- | ------------------------------------------------ |
| **Max lines per file**          | 100 lines (hard limit)                           |
| **Max lines per function**      | 20 lines (aim for 10)                            |
| **Max parameters per function** | 3 (use an object/type for more)                  |
| **Max nesting depth**           | 2 levels (no nested ifs inside loops inside ifs) |
| **Functions per file**          | ≤ 5 exported functions                           |

**If a file approaches 100 lines → split it.** Create a subfolder with `index.ts` re-exporting.

---

## 3. Code Quality Rules

### 3.1 NO Comments

```typescript
// BAD — comment explains unclear code
// Check if the user has permission to moderate
if (user.role === 'moderator' && user.faculty !== report.faculty) {

// GOOD — the code IS the explanation
const canModerate = isModerator(user) && hasNoFacultyConflict(user, report)
if (canModerate) {
```

The ONLY acceptable comments:

- `TODO:` with a GitHub issue number — `// TODO(#42): implement CSAM hash check`
- JSDoc on exported public API types (not implementation)

### 3.2 Small Pure Functions

```typescript
// BAD — does too many things
function handleReport(data: unknown) {
  const parsed = schema.parse(data)
  const hash = crypto.createHmac('sha256', key).update(parsed.email).digest('hex')
  await db.insert(users).values({ emailHash: hash })
  await db.insert(reports).values({ title: parsed.title, tokenId: parsed.tokenId })
  await queue.send({ reportId: id })
  return { success: true }
}

// GOOD — each function does ONE thing
function parseReportInput(data: unknown): CreateReportInput {
  return createReportSchema.parse(data)
}

function computeEmailHash(email: string, key: string): string {
  return crypto.createHmac('sha256', key).update(email).digest('hex')
}

async function insertReport(input: CreateReportInput): Promise<Report> {
  return db.insert(reports).values(input).returning()
}
```

### 3.3 Early Returns (Guard Clauses)

```typescript
// BAD — deep nesting
function getReport(id: string, user: User) {
  if (id) {
    const report = await findReport(id)
    if (report) {
      if (report.status === 'published' || report.tokenId === user.tokenId) {
        return report
      }
    }
  }
  throw new NotFoundError()
}

// GOOD — flat and clear
function getReport(id: string, user: User) {
  if (!id) throw new BadRequestError('Missing report ID')

  const report = await findReport(id)
  if (!report) throw new NotFoundError('Report not found')

  const isPublic = report.status === 'published'
  const isAuthor = report.tokenId === user.tokenId
  if (!isPublic && !isAuthor) throw new ForbiddenError()

  return report
}
```

### 3.4 Avoid Unnecessary Loops

```typescript
// BAD — manual loop when a built-in method works
let found = false
for (const item of items) {
  if (item.id === targetId) {
    found = true
    break
  }
}

// GOOD — use the right method
const found = items.some((item) => item.id === targetId)
```

```typescript
// BAD — loop to transform
const names = []
for (const user of users) {
  names.push(user.name)
}

// GOOD — declarative
const names = users.map((user) => user.name)
```

### 3.5 SOLID Principles

| Principle                     | How We Apply It                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **S — Single Responsibility** | One file = one purpose. `hash-email.ts` only hashes emails.                     |
| **O — Open/Closed**           | Use Zod schemas + TypeScript generics to extend, not modify.                    |
| **L — Liskov Substitution**   | Interfaces over concrete classes. `StoragePort` works with Cloudinary or local. |
| **I — Interface Segregation** | Small focused types. `CreateReportInput` not `ReportEverything`.                |
| **D — Dependency Inversion**  | Business logic depends on interfaces (ports), not implementations (adapters).   |

---

## 4. Project Architecture (Hexagonal)

```
apps/api/src/
├── domain/           # Pure business logic — NO imports from infrastructure
│   ├── entities/     # Report, User, AnonymousProfile types
│   ├── ports/        # Interfaces: ReportRepository, StorageService, etc.
│   └── errors/       # Domain-specific errors: NotFoundError, ForbiddenError
├── application/      # Use cases — orchestrate domain + ports
│   ├── create-report.ts
│   ├── moderate-report.ts
│   └── vote-on-report.ts
├── infrastructure/   # Real implementations of ports
│   ├── db/           # Drizzle schemas, repository implementations
│   ├── storage/      # Cloudinary adapter
│   ├── ai/           # Workers AI adapter
│   ├── queue/        # Cloudflare Queue adapter
│   └── auth/         # Clerk JWT verification
└── http/             # Hono routes — thin layer, calls use cases
    ├── routes/
    └── middleware/
```

**Import rule:** `domain/ ← application/ ← infrastructure/ ← http/`
Never import backwards (domain must NEVER import from infrastructure).

---

## 5. TypeScript Config

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
  },
}
```

**Zero `any`.** Use `unknown` + type narrowing or Zod parsing.

---

## 6. Error Handling

```typescript
// Domain errors — thrown by business logic
class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
  }
}

class NotFoundError extends DomainError {
  /* ... */
}
class ForbiddenError extends DomainError {
  /* ... */
}
class ValidationError extends DomainError {
  /* ... */
}
```

- Domain throws `DomainError` subclasses
- HTTP layer catches and maps to HTTP status codes
- NEVER expose stack traces to the client
- Sentry captures errors via `beforeSend` (no PII)

---

## 7. Testing

| Type              | Tool               | Where                        |
| ----------------- | ------------------ | ---------------------------- |
| Unit tests        | Vitest             | `*.test.ts` next to the file |
| Integration tests | Vitest + miniflare | `__tests__/integration/`     |
| E2E tests         | Playwright         | `apps/web/e2e/`              |

- File: `create-report.ts` → Test: `create-report.test.ts` (same folder)
- Minimum 80% coverage on backend business logic
- Tests are NOT optional — a feature without tests is not done

---

## 8. Git Conventions

| Rule                   | Format                                           |
| ---------------------- | ------------------------------------------------ |
| **Branch naming**      | `sprint-N/feature-name` — `sprint-1/scaffolding` |
| **Commit messages**    | Conventional Commits: `feat(scope): description` |
| **Commit frequency**   | Every logical unit of work (not at end of day)   |
| **Commit granularity** | Atomic — one concern per commit (see below)      |
| **PR rule**            | At least 1 reviewer approval before merge        |

### Atomic Commit Rule

NEVER bundle an entire feature in a single commit. Each commit must be:

- **Small**: one port, one adapter, one use case, one route, or one test file
- **Buildable**: `tsc --noEmit` must pass after each commit
- **Testable**: tests pass after each commit (no broken intermediate states)
- **Reviewable**: a teammate can understand the commit in under 2 minutes
- **Bisectable**: `git bisect` can pinpoint exactly where a bug was introduced

**Commit sequence for a typical feature (e.g., CRUD reports):**

1. `feat(reports): add report repository port (interface)`
2. `feat(reports): add report repository adapter (drizzle)`
3. `feat(reports): add create-report use case`
4. `feat(reports): add POST /reports route`
5. `test(reports): add create-report unit tests`
6. `feat(reports): add get-report use case + GET route`
7. `test(reports): add get-report tests`

**Anti-pattern**: `feat(reports): complete CRUD + tests + middleware` (40 files, +1300 lines)

### Commit Types

| Type       | Use                                   |
| ---------- | ------------------------------------- |
| `feat`     | New feature                           |
| `fix`      | Bug fix                               |
| `refactor` | Code restructure (no behavior change) |
| `docs`     | Documentation only                    |
| `test`     | Adding or fixing tests                |
| `ci`       | CI/CD changes                         |
| `chore`    | Dependencies, configs                 |

### Examples

```
feat(auth): implement Clerk webhook for user creation
feat(reports): add cursor-based pagination to feed endpoint
fix(moderation): prevent faculty conflict in moderator assignment
refactor(api): extract email hashing to domain layer
test(auth): add JWT verification edge cases
ci: add typecheck step to GitHub Actions workflow
chore: upgrade hono to 4.x
```

---

## 9. Environment Variables

- ALL env vars documented in `.env.example` (placeholder values only)
- Real values ONLY in `.env.local` (gitignored) or Cloudflare Secrets
- Access via typed config object, NEVER raw `process.env.X` scattered in code

```typescript
// BAD — scattered env access
const key = process.env.ENCRYPTION_MASTER_KEY!

// GOOD — centralized typed config
// config.ts
export function getConfig(env: Env): Config {
  return {
    encryptionMasterKey: env.ENCRYPTION_MASTER_KEY,
    databaseUrl: env.DATABASE_URL,
  }
}
```

---

## 10. Dependency Rules

| Package           | Where             | Purpose                                                     |
| ----------------- | ----------------- | ----------------------------------------------------------- |
| **zod**           | `packages/shared` | Schema validation (shared frontend + backend)               |
| **drizzle-orm**   | `apps/api`        | Database ORM                                                |
| **hono**          | `apps/api`        | HTTP framework for Workers                                  |
| **@clerk/nextjs** | `apps/web`        | Auth UI components                                          |
| **tailwindcss**   | `apps/web`        | Styling                                                     |
| **shadcn/ui**     | `apps/web`        | Accessible UI primitives (source code, not runtime dep)     |
| **react-bits**    | `apps/web`        | Animated backgrounds/effects (source code, not runtime dep) |
| **vitest**        | root              | Testing                                                     |
| **playwright**    | `apps/web`        | E2E testing                                                 |

> **Note on shadcn/ui & React Bits:** These are NOT traditional npm dependencies. Their CLI copies component source code into the project (`src/components/ui/` and `src/components/backgrounds/`). The code is fully owned and modifiable — no external runtime. Only their peer dependencies (Radix primitives, utility libs like `clsx`, `tailwind-merge`) are installed as real npm packages.

**Rule:** Before adding ANY new dependency, check if it works in Cloudflare Workers (V8 isolate, no Node.js APIs).

---

## 11. Performance Rules

- NO unnecessary database queries — batch when possible
- NO N+1 queries — use joins or `IN` clauses
- Use `Map` / `Set` over array `.find()` / `.includes()` for lookups
- Prefer `Array.map/filter/some/every` over manual `for` loops
- NEVER block the event loop — all I/O is async
- ISR for read-heavy pages — revalidate every 60 seconds
- Client-side: lazy load below-fold components with `next/dynamic`

---

## 12. Security Rules (Non-Negotiable)

- NEVER log emails, passwords, tokens, or PII
- NEVER store plaintext email in our database
- NEVER expose stack traces in API responses
- NEVER use `eval()` or `Function()` constructor
- NEVER trust client input — always validate with Zod on the server
- ALL file uploads verified by magic bytes, not file extension
- ALL evidence delivered through CDN proxy, never direct Cloudinary URL
- Sentry `beforeSend` strips any accidental PII before sending

---

## 13. Quick Reference — Credentials Location

All service credentials are in `docs/CREDENTIALS.md` (LOCAL ONLY, gitignored).

| Service    | What We Have                                                            |
| ---------- | ----------------------------------------------------------------------- |
| Neon       | `DATABASE_URL` (connection pooling ON)                                  |
| Cloudflare | `CLOUDFLARE_ACCOUNT_ID` (API Token pending)                             |
| Clerk      | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, PEM public key |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`  |
| Resend     | `RESEND_API_KEY`                                                        |
| Sentry     | `NEXT_PUBLIC_SENTRY_DSN` (backend DSN pending)                          |
| Encryption | Generated at deploy time via `scripts/generate-encryption-keys.ts`      |

---

## 14. Folder Structure Target (F1 Complete)

```
MAME/
├── apps/
│   ├── web/                  # Next.js 15 (Cloudflare Pages)
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   ├── components/   # React components
│   │   │   │   ├── ui/       # shadcn/ui primitives (Button, Input, Card, Sidebar, etc.)
│   │   │   │   ├── backgrounds/ # React Bits backgrounds (Galaxy, etc.)
│   │   │   │   ├── feed/     # Report feed feature components
│   │   │   │   ├── report-form/  # Report creation form
│   │   │   │   ├── report-detail/ # Report detail view
│   │   │   │   └── my-reports/    # User's reports list
│   │   │   ├── hooks/        # Custom hooks
│   │   │   └── lib/          # Utils, config (includes shadcn cn() helper)
│   │   ├── public/
│   │   ├── components.json   # shadcn/ui configuration
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   └── api/                  # Hono.js (Cloudflare Worker)
│       ├── src/
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   └── http/
│       ├── wrangler.toml
│       └── tsconfig.json
├── packages/
│   └── shared/               # Zod schemas, types, constants
│       ├── src/
│       └── tsconfig.json
├── scripts/
│   ├── generate-encryption-keys.ts
│   └── seed.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.base.json
├── package.json
└── docs/                     # Architecture docs (already exist)
```
