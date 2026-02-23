# DSS — Data Security Specification

> **MAME v2.0** — Complete Security Architecture, Threat Model, Privacy Design & Incident Response
>
> *Synthesized from: `MAME_Seguridad.pdf` (DSS v1.0, 11 pages) and `MAME_Seguridad_v2.pdf` (DSS v2.0, 8 pages)*

---

## ⚠️ CRITICAL WARNING

**MAME is NOT a typical web application.** It is a platform where real people — students — report corruption, harassment, and institutional abuse. If their identity is exposed:

- A professor could retaliate academically (fail them, block their thesis)
- An administrator could expel or blacklist them
- A harasser could target them directly
- Legal or physical threats are possible

**Security is not a feature — it is an ethical obligation.** Every line of code that touches user data must be written with this in mind.

---

## 1. Real-World Failure Scenarios

Before diving into technical controls, understand what goes wrong if security fails:

| Failure Scenario | Real Consequence | Technical Prevention |
|---|---|---|
| **Identity leak** | Professor retaliates against student who reported them | HMAC-SHA256 email hashing, no plaintext storage, token-only publication references |
| **Database breach** | Mass de-anonymization of all reporters | Email-token relation stored as one-way hash requiring 2 separate keys (ENCRYPTION_MASTER_KEY + ENCRYPTION_RELATION_KEY), both in Cloudflare Secrets |
| **SQL injection** | Attacker extracts users table | Drizzle ORM prepared statements + Zod input validation |
| **Corrupt moderator** | Internal betrayal — moderator identifies reporters | Moderators only see anonymous tokens, never emails. Immutable audit log of all moderator actions. |
| **IP logs exposed** | Students identified via university network logs | NO IP addresses stored anywhere in the system — not in logs, not in DB, not in analytics |
| **File metadata** | Evidence photo reveals device, GPS location, author name | Cloudinary `flags: 'strip_profile'` strips ALL EXIF/GPS/device metadata from images on upload. pdf-lib strips PDF metadata in-Worker (pure JS). Cloudinary video transformations strip container metadata. |
| **Timing correlation** | "Report appeared at 3pm, who was online at 3pm?" | Random 1-6h publication delay via Cloudflare Queues, relative timestamps only |

---

## 2. STRIDE Threat Model

### 2.1 CRITICAL Threats

#### (A) De-Anonymization by Data Correlation

**Attack:** An adversary (e.g., corrupt university admin) cross-references publication time + writing style + specific incident details + university network logs to identify the reporter.

**Mitigations:**
- No IP addresses logged — ever
- Publication delay: random 1-6 hours after moderator approval via Cloudflare Queues
- UI shows relative timestamps only ("2 hours ago"), not exact times
- All file EXIF metadata stripped before storage (no device/GPS/author/timestamp)
- Rate limiting prevents behavioral fingerprinting through submission patterns
- Anti-timing analysis: report creation response time is constant regardless of processing

#### (B) Database Breach with Email-Token Linking

**Attack:** An attacker obtains a full database dump and attempts to link emails to anonymous tokens to identify reporters.

**Mitigations:**
- Email-token relationship is NEVER stored in plaintext
- `email_hash = HMAC-SHA256(email, ENCRYPTION_MASTER_KEY)` — ENCRYPTION_MASTER_KEY in Cloudflare Secrets, not DB
- `relation_proof = HMAC-SHA256(email_hash + token_id, ENCRYPTION_RELATION_KEY)` — ENCRYPTION_RELATION_KEY in Cloudflare Secrets
- Without BOTH `ENCRYPTION_MASTER_KEY` AND `ENCRYPTION_RELATION_KEY` (neither in the database), a full DB dump reveals NOTHING about who owns which token
- Keys stored ONLY in Cloudflare Secrets (encrypted at rest, accessible only by Workers runtime)
- Key rotation every 90 days with re-hashing migration
- Even a compromised database admin cannot link identities
- **Clerk trust boundary:** Clerk stores plaintext emails but has NO knowledge of anonymous tokens. Our DB has tokens but NO plaintext emails. Both systems + both keys must be compromised simultaneously to break anonymity.

#### (C) Illegal Content Injection (CSAM, Drugs, Weapons)

**Attack:** Malicious actors attempt to use MAME to distribute child sexual abuse material, drug sale listings, weapon trafficking instructions, or violent content.

**Mitigations:**
- Workers AI content filter runs BEFORE any file reaches Cloudinary storage or DB
- Perceptual hashing (pHash) against locally-maintained hash lists for known-bad image detection
- **NCMEC access limitation:** Direct access to NCMEC’s hash database requires ESP (Electronic Service Provider) registration, which requires corporate entity status. As a university project, MAME uses AI-based detection (Llama Guard 3 + Llama 3.2 Vision) as primary defense.
- **Legal obligation:** If suspected CSAM is detected by any means, mandatory report to NCMEC CyberTipline (18 U.S.C. § 2258A). Process documented in incident response.
- Llama Guard 3 (`@cf/meta/llama-guard-3-8b`) for text content safety classification
- Llama 3.2 Vision (`@cf/meta/llama-3.2-11b-vision-instruct`) for image content analysis
- **ABSOLUTE RULE:** Content flagged as illegal is NEVER stored — not in DB, not in Cloudinary, nowhere
- Forensic log records the attempt: timestamp + anonymous token + content hash (not content)
- Token that attempted upload is flagged for review

### 2.2 HIGH Threats

| Threat | Attack Vector | Mitigation |
|---|---|---|
| **SQL Injection** | Crafted input in forms/URLs to execute arbitrary SQL | Drizzle ORM with native prepared statements (parameterized queries). Zod schema validation on ALL inputs. No raw SQL concatenation ever. |
| **XSS (Cross-Site Scripting)** | Inject malicious JavaScript via report content, comments | Next.js auto-escapes output by default. CSP strict headers (`script-src 'self'`). DOMPurify for any user-generated HTML. NEVER use `dangerouslySetInnerHTML`. |
| **Unauthorized Moderator Access** | Attacker gains moderator role or bypasses role check | Role verification on EVERY backend endpoint (not just frontend). JWT RS256 — backend always verifies signature with Clerk's public key. No role stored in JWT payload alone. |
| **Brute Force Login** | Automated attempts to guess user passwords | Clerk.dev handles rate limiting and password security. 5 failed attempts → 15-minute block. 10 failed → 1-hour block + CAPTCHA. Password hashing managed by Clerk (bcrypt). |
| **File Metadata Exposure** | Uploaded photo contains GPS, device name, author | Cloudinary `strip_profile` flag removes ALL EXIF data from images on upload. pdf-lib (pure JS, runs in Workers) strips author/program/dates from PDFs before upload. Cloudinary video transformations strip embedded metadata. |
| **ID Enumeration** | Sequential IDs allow crawling all resources | UUID v4 for ALL entity IDs (users, tokens, reports, evidence, comments). Permission check on every endpoint — knowing an ID doesn't grant access. |
| **DDoS** | Volumetric attack overwhelming the service | Cloudflare auto-blocks volumetric attacks at edge. Rate limiting per IP (100 req/min public). Rate limiting per token (20 req/min write). Workers auto-scale. |

### 2.3 MEDIUM Threats

| Threat | Attack Vector | Mitigation |
|---|---|---|
| **CSRF** | Forged requests from external sites | Clerk.dev + Next.js default CSRF protection. Origin header verification. Cookies set with `SameSite=Strict`. |
| **Path Traversal** | Manipulated file paths to access server files | Files stored with UUID-based public_ids in Cloudinary, original name never used. Cloudinary uses flat namespace (no directories to traverse). |
| **Command Injection** | Shell commands injected via user input | Cloudflare Workers are sandboxed V8 isolates — NO shell access, NO file system, NO exec(). Injection is architecturally impossible. |
| **ReDoS** | Crafted input triggers exponential regex backtracking | Avoid complex regexps. Use Zod schemas for validation (string length, format checks, no regex when possible). |
| **Open Redirect** | Manipulated redirect URL sends user to malicious site | URL whitelist validation on all redirects. Reject any URL not matching MAME domain. |

---

## 3. Privacy Architecture — The Core Design

### 3.1 Registration Cryptographic Flow (7 Steps)

```
Step 1: User registers via Clerk.dev (email + password)
        Clerk handles email verification UI, password hashing, and session management.
        Clerk stores the email on their SOC 2 Type II infrastructure.

Step 2: Clerk fires `user.created` webhook to our backend
        Backend receives the verified email + Clerk user ID

Step 3: email_hash = HMAC-SHA256(email, ENCRYPTION_MASTER_KEY)
        ENCRYPTION_MASTER_KEY stored ONLY in Cloudflare Secrets
        email_hash is deterministic: same email → same hash (for login lookup)
        BUT irreversible: cannot get email from hash without ENCRYPTION_MASTER_KEY

Step 4: Store in `users` table: { clerk_id, email_hash }
        ⚠️ NO PLAINTEXT EMAIL EXISTS IN OUR DATABASE
        Passwords handled entirely by Clerk (never touch our system)

Step 5: Generate anonymous_token = UUID v4
        Cryptographic random, no sequential pattern
        No relationship to email in its generation

Step 6: Store in `anonymous_profiles` table: { token_id }
        This is the user's public identity on the platform

Step 7: relation_proof = HMAC-SHA256(email_hash + token_id, ENCRYPTION_RELATION_KEY)
        ENCRYPTION_RELATION_KEY stored ONLY in Cloudflare Secrets
        Store in `identity_links` table: { relation_proof }
        NO foreign keys to users or anonymous_profiles — just a one-way hash
```

**Result:** Three tables, zero direct relationships. Clerk has the email but not the token. Our DB has the token but not the email. Without BOTH `ENCRYPTION_MASTER_KEY` AND `ENCRYPTION_RELATION_KEY` (both in Cloudflare Secrets, not in the database), it is mathematically impossible to determine which email corresponds to which anonymous token.

> **Clerk Trust Boundary Analysis:**
> | System | Has Email? | Has Token? | Has Link? |
> |---|---|---|---|
> | **Clerk.dev** | ✅ Yes (plaintext) | ❌ No | ❌ No |
> | **Our Database** | ❌ No (only HMAC hash) | ✅ Yes | ❌ No (only HMAC proof) |
> | **Cloudflare Secrets** | ❌ No | ❌ No | ⚠️ Contains the keys that COULD derive the link |
>
> **To de-anonymize a user, an attacker must compromise ALL THREE systems simultaneously.**

### 3.2 Publication Flow (6 Steps)

```
Step 1: User publishes report
         → Associated ONLY to anonymous_token (token_id)
         → No reference to users table

Step 2: Workers AI analyzes content (text + images)
         → Illegal content → REJECT, log attempt, NEVER store
         → Clean content → proceed

Step 3: Metadata stripping (Cloudinary + pdf-lib)
         → Images: Cloudinary `strip_profile` flag removes GPS, device, author, timestamps on upload
         → PDFs: pdf-lib (pure JS, runs in Workers) strips author, program, creation date before upload
         → Videos: Cloudinary video transformations strip container metadata on upload
         → Note: Sharp/ffmpeg CANNOT run in Workers (V8 isolates). Cloudinary handles media processing.

Step 4: Files renamed to UUID v4
         → Original filename NEVER stored
         → "photo_from_my_phone.jpg" → "a7f3b2c1-d4e5-6789-abcd-ef0123456789.jpg"

Step 5: Content stored in Cloudinary with signed URLs (time-limited authentication tokens)
         → No permanent public URLs
         → Access requires valid, time-limited signed URL with Cloudinary API secret

Step 6: Report enters Cloudflare Queue with random 1-6h delay
         → Prevents temporal correlation attacks
         → Moderator approval time ≠ publication time
```

---

## 4. Security Controls by Category

### 4.1 Transport Security

| Control | Configuration |
|---|---|
| **TLS** | 1.3 (latest), enforced by Cloudflare |
| **HSTS** | `max-age=31536000; includeSubDomains` — forces HTTPS for 1 year |
| **Certificate** | Managed by Cloudflare (auto-renewal, certificate pinning) |
| **WAF** | Cloudflare Web Application Firewall active |
| **CORS** | Strict — only MAME domain(s) allowed, no wildcard |

### 4.2 Authentication Security

| Control | Configuration |
|---|---|
| **JWT Algorithm** | RS256 (asymmetric) — NOT HS256 (symmetric). Even if public key leaks, tokens can't be forged. |
| **Access Token** | 1 hour expiry — limits damage window if compromised |
| **Refresh Token** | 7 days with automatic rotation — old token invalidated on use |
| **Password Hashing** | Handled by Clerk.dev (bcrypt, managed infrastructure) — passwords never touch our system |
| **Login Rate Limit** | 5 failures → 15min block. 10 failures → 1h block + CAPTCHA |
| **Session Storage** | In browser memory only — no persistent session cookies |
| **Logout** | Immediate server-side JWT + refresh token invalidation |

### 4.3 Input/Output Security

| Control | Configuration |
|---|---|
| **SQL Injection** | Drizzle ORM prepared statements + Zod validation. ZERO raw SQL concatenation. |
| **XSS** | CSP strict (`script-src 'self'`) + DOMPurify + Next.js auto-escape. Never `dangerouslySetInnerHTML`. |
| **Path Traversal** | UUID filenames for all stored files. No user-provided paths. |
| **Command Injection** | Architecturally impossible — Workers run in sandboxed V8 isolates with no shell access. |
| **Input Validation** | Zod schemas on ALL write endpoints. Frontend + backend validation (never trust client only). |

### 4.4 Evidence File Security

| Control | Configuration |
|---|---|
| **Pre-analysis** | Workers AI scans content BEFORE storage in Cloudinary |
| **EXIF Stripping** | Cloudinary `flags: 'strip_profile'` removes ALL image metadata (GPS, device, author, timestamp) on upload |
| **PDF Metadata** | pdf-lib removes author, creation program, creation date, modification date |
| **Video Metadata** | Cloudinary video transformation pipeline strips embedded metadata, container info on upload |
| **File Naming** | Original filename NEVER stored. Replaced with UUID v4. |
| **Type Verification** | Magic number (file header bytes), not file extension |
| **Size Limit** | 50MB per file, 200MB per report |
| **Access** | Signed URLs with time-limited authentication tokens. Cloudinary authenticated delivery mode. |

### 4.5 Operational Security

| Control | Configuration |
|---|---|
| **Secrets Management** | All keys in Cloudflare Secrets — never in code, .env files, or database |
| **Key Rotation** | Every 90 days with migration script to re-hash affected data |
| **Key Naming** | `ENCRYPTION_MASTER_KEY` (email hashing) and `ENCRYPTION_RELATION_KEY` (identity linking) — standardized across all docs and code |
| **Audit Logging** | All moderation actions logged immutably (no UPDATE/DELETE on audit table) |
| **Error Monitoring** | Sentry.io configured to EXCLUDE personal data (emails, tokens) from error reports |
| **Dependency Scanning** | Dependabot active, zero critical/high vulnerabilities required |
| **Code Review** | Mandatory PR review: 1 reviewer standard, 2 reviewers for security-related changes |
| **Pen Testing** | OWASP ZAP scan before public launch — zero critical/high findings |
| **Environment Isolation** | Separate Neon DB branches for dev/staging/prod. Separate Cloudflare Workers per env. |

---

## 5. Incident Response Plan

### 5.1 Severity Levels

| Level | Description | Response Time | Examples |
|---|---|---|---|
| **P0 — Critical** | User identity potentially exposed, data breach | **15 minutes** | DB breach with email exposure, encryption key compromise, identity linking discovered |
| **P1 — High** | Illegal content published, moderator account compromised | **30 minutes** | CSAM bypassed filter, moderator acting maliciously, auth bypass |
| **P2 — Medium** | Suspicious activity, potential abuse | **2 hours** | Unusual token behavior, mass spam reports, rate limit bypass |
| **P3 — Low** | Minor vulnerability, incorrect configuration | **24 hours** | Minor XSS (no data exfiltration), incorrect rate limit, non-critical dependency CVE |

### 5.2 Response Procedures

**P0 — Critical (Identity Exposure):**
1. Immediately shut down affected system component
2. Assess scope: how many users potentially affected
3. Notify all potentially affected users via in-app notification
4. Notify university data protection officer if applicable
5. Contact legal counsel if legal obligations triggered
6. Root cause analysis within 24 hours
7. Post-mortem document shared with full team

**P1 — High (Illegal Content / Compromised Moderator):**
1. Remove illegal content immediately from Cloudinary + DB
2. Revoke compromised moderator's access tokens
3. Review moderator's audit log for past actions
4. Flag all reports reviewed by compromised moderator for re-review
5. Log forensic evidence for potential legal authorities
6. Patch vulnerability within 4 hours

**P2 — Medium (Suspicious Activity):**
1. Suspend suspicious token(s) immediately
2. Review token's activity history (all anonymous — no identity reveal)
3. Assess if pattern indicates coordinated attack
4. Adjust rate limits or add temporary restrictions
5. Document and monitor for 48 hours

**P3 — Low (Minor Vulnerability):**
1. Document in issue tracker
2. Patch in next scheduled deploy
3. Add regression test
4. Update security documentation

---

## 6. Legal Identity Request Protocol

> **This process exists to comply with legal obligations. It is deliberately difficult and audited to prevent misuse.**

### 6-Step Protocol

1. **Receive court order** — Must be a formal, written court order (not a university request, not a police inquiry without judicial backing). Verify with legal counsel.
2. **Legal review** — Team's legal advisor verifies the order is legitimate, properly scoped, and legally binding.
3. **Public community notification** — MAME publishes a transparency notice that a legal identity request was received (without revealing case details, affected user, or report).
4. **Technical process** — Requires BOTH `ENCRYPTION_MASTER_KEY` and `ENCRYPTION_RELATION_KEY` to be used simultaneously. This process requires physical approval by at least 2 project founders (multi-party authorization).
5. **Immutable audit log** — Every step of the identity reveal process is logged: who authorized it, when, which court order, which token.
6. **Information delivered ONLY to the legal authority** — Never to the university, never to third parties, never to the requester directly.

### Technical Limitation (By Design)

Even with a valid court order AND both cryptographic keys, the system can ONLY:
- Link an anonymous token to an email hash
- Derive the original email from the hash (using ENCRYPTION_MASTER_KEY)

The system CANNOT reveal:
- Device used (no device data stored)
- Physical location (no GPS/IP stored)
- Exact time of submission (random delay obscures timing)
- Browsing history or other activity (not tracked)

---

## 7. Pre-Launch Security Checklist (24 Items)

### Sprint 1 — Foundation (10 items)

| # | Control | Check |
|---|---|---|
| 1 | TLS 1.3 active + HTTPS redirect for all traffic | ☐ |
| 2 | HSTS header: `max-age=31536000; includeSubDomains` | ☐ |
| 3 | CSP header strict: `script-src 'self'` — no `unsafe-inline` | ☐ |
| 4 | ENCRYPTION_MASTER_KEY + ENCRYPTION_RELATION_KEY stored in Cloudflare Secrets (not in code, .env, or DB) | ☐ |
| 5 | All emails stored as HMAC-SHA256 hash (no plaintext email in any table) | ☐ |
| 6 | Password hashing handled by Clerk.dev (bcrypt, managed infrastructure — passwords never in our DB) | ☐ |
| 7 | JWT signed with RS256 (asymmetric), NOT HS256 | ☐ |
| 8 | All entity IDs are UUID v4 (no sequential integers) | ☐ |
| 9 | CORS configured to accept ONLY MAME domain(s) | ☐ |
| 10 | Dependabot active with zero critical/high alerts | ☐ |

### Sprint 2 — Content Security (8 items)

| # | Control | Check |
|---|---|---|
| 11 | Rate limiting active on login + content creation endpoints | ☐ |
| 12 | ALL database queries use prepared statements via Drizzle (no string concatenation) | ☐ |
| 13 | Zod validation on ALL write endpoints (create report, comment, vote, etc.) | ☐ |
| 14 | EXIF metadata stripped from ALL images via Cloudinary `strip_profile` flag on upload | ☐ |
| 15 | PDF metadata stripped from ALL PDFs before Cloudinary upload (pdf-lib) | ☐ |
| 16 | File type verified by magic number, not declared extension | ☐ |
| 17 | Workers AI content filter runs BEFORE any file is stored in Cloudinary | ☐ |
| 18 | Cloudinary evidence files accessible ONLY via signed URLs with expiration | ☐ |

### Sprint 3 — Operational Security (3 items)

| # | Control | Check |
|---|---|---|
| 19 | Sentry configured to exclude emails, tokens, and personal data from error reports | ☐ |
| 20 | Moderation audit log records every action with timestamp and moderator token | ☐ |
| 21 | Publication delay active (random 1-6h via Cloudflare Queues) | ☐ |

### Sprint 4 — Pre-Launch (3 items)

| # | Control | Check |
|---|---|---|
| 22 | OWASP ZAP automated scan: zero critical vulnerabilities, zero high vulnerabilities | ☐ |
| 23 | Incident response plan documented and communicated to all team members | ☐ |
| 24 | Legal identity request protocol documented with multi-party authorization | ☐ |

---

## 8. Security Headers Reference

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://res.cloudinary.com; connect-src 'self' https://api.clerk.dev; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 9. Key Rotation Procedure

**Frequency:** Every 90 days

**Process:**
1. Generate new `ENCRYPTION_MASTER_KEY_v{N+1}` and `ENCRYPTION_RELATION_KEY_v{N+1}`
2. Store new keys in Cloudflare Secrets alongside old keys
3. Run migration script: re-hash all `email_hash` values with new ENCRYPTION_MASTER_KEY
4. Re-hash all `relation_proof` values with new keys
5. Verify migration (test login, test identity link for test account)
6. Remove old keys from Cloudflare Secrets
7. Log rotation event in security audit log

**CRITICAL:** If ENCRYPTION_MASTER_KEY is lost, email hash lookups break (can't verify email hashes for new webhook events). If ENCRYPTION_RELATION_KEY is lost, identity linking becomes permanently impossible (which may be acceptable from a privacy standpoint, but breaks legal compliance).
