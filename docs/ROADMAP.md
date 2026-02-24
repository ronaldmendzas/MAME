# ROADMAP — 10 Fases de Desarrollo hasta Producción

> **MAME v1.0** — Plan de Ejecución Detallado: desde código cero hasta lanzamiento público.
>
> Cada fase tiene: objetivo claro, entregables, pasos exactos, criterio de "terminado", y qué se puede validar antes de avanzar.

---

## Resumen de Fases

| Fase | Nombre | Duración estimada | Entregable |
|---|---|---|---|
| **F1** | Scaffolding & Infraestructura | 2-3 días | Monorepo funcional con CI/CD |
| **F2** | Base de Datos & Migraciones | 1-2 días | Schema completo en Neon |
| **F3** | Autenticación & Anonimato | 3-4 días | Registro → token anónimo funcional |
| **F4** | CRUD de Reportes (sin archivos) | 2-3 días | Crear y ver reportes (solo texto) |
| **F5** | Pipeline de Evidencia | 3-4 días | Upload con compresión + Cloudinary |
| **F6** | Moderación AI & Colas | 3-4 días | Filtro automático + colas de publicación |
| **F7** | CDN Proxy & Seguridad de Media | 2 días | Entrega vía proxy con cache |
| **F8** | Panel de Moderación Humana | 3-4 días | Interfaz de moderadores funcional |
| **F9** | Comunidad & Feed Público | 3-4 días | Comentarios, votos, búsqueda, notificaciones |
| **F10** | Polish, Seguridad & Lanzamiento | 4-5 días | Producción live |

**Total estimado:** 26-35 días de desarrollo activo (~5-7 semanas)

---

## Fase 1 — Scaffolding & Infraestructura

### Objetivo
> "Un `git clone` + `npm install` + `docker compose up` y cualquier desarrollador tiene todo corriendo en local."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 1.1 | Crear monorepo con npm workspaces | `apps/web` (Next.js 15), `apps/api` (Hono.js Worker), `packages/shared` (Zod, tipos) |
| 1.2 | Configurar TypeScript strict | `tsconfig.base.json` compartido. Cada app hereda + personaliza. `strict: true`, `noUncheckedIndexedAccess: true`. |
| 1.3 | Configurar ESLint + Prettier | Config compartida en raíz. Rules: no `any`, no `console.log`, import order. Prettier: single quotes, no semicolons. |
| 1.4 | Crear `apps/web` con Next.js 15 | App Router, Tailwind CSS, sin `/pages`. Layout base con header/footer. |
| 1.5 | Crear `apps/api` con Hono.js | Worker skeleton con healthcheck `GET /health` → `{ status: "ok" }`. wrangler.toml básico. |
| 1.6 | Crear `packages/shared` | Exportar tipos base y schemas Zod (se llenan en F2-F4). |
| 1.7 | Docker Compose para dev local | PostgreSQL 16 (simula Neon en local), Adminer/pgAdmin opcional. Persistencia en volumen. |
| 1.8 | `.env.example` con todos los placeholders | Todas las variables necesarias documentadas con nombres exactos (sin valores reales). |
| 1.9 | GitHub Actions CI | Workflow: install → lint → typecheck → test → build. Corre en cada PR. Bloquea merge si falla. |
| 1.10 | Configurar Drizzle ORM | `drizzle.config.ts` apuntando a Neon. Comandos: `db:generate`, `db:migrate`, `db:push`, `db:studio`. |
| 1.11 | Configurar wrangler.toml | Bindings: KV namespace, Queue, AI, Secrets placeholders. Dev mode con `wrangler dev`. |
| 1.12 | Configurar Sentry (ambos proyectos) | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`. `beforeSend` para stripear datos personales. |
| 1.13 | Crear `scripts/` con utilidades | `generate-encryption-keys.ts` (genera MASTER + RELATION keys). `seed.ts` (datos de prueba, se completa en F2). |

### Criterio de "Terminado"

- [ ] `npm install` desde raíz instala todo (web + api + shared)
- [ ] `npm run dev` levanta Next.js en :3000 y Worker en :8787
- [ ] `docker compose up` levanta PostgreSQL local
- [ ] `npm run lint` + `npm run typecheck` pasan sin errores
- [ ] `npm run build` genera builds de ambas apps
- [ ] GitHub Actions corre en un PR de prueba y pasa
- [ ] `GET http://localhost:8787/health` devuelve `{ status: "ok" }`

### Commit: `feat(infra): project scaffolding — monorepo, configs, CI/CD`

---

## Fase 2 — Base de Datos & Migraciones

### Objetivo
> "Todas las tablas existen en Neon con índices, constraints y relaciones. Drizzle genera las migraciones automáticamente."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 2.1 | Schema `users` | `id` (UUID PK), `clerk_id` (TEXT UNIQUE), `email_hash` (TEXT UNIQUE), `role` (ENUM: user/moderator/admin), `faculty` (TEXT), `created_at`, `updated_at`. **Sin columna de password ni email en texto plano.** |
| 2.2 | Schema `anonymous_profiles` | `token_id` (UUID PK), `display_name` (TEXT, auto-generado tipo "Ciudadano-4829"), `created_at`. **Sin FK a users.** |
| 2.3 | Schema `identity_links` | `id` (UUID PK), `email_hash` (TEXT), `token_id` (TEXT), `relation_proof` (TEXT). Solo acceso emergencia. |
| 2.4 | Schema `reports` | `id` (UUID PK), `token_id` (TEXT, ref anonymous_profiles), `title`, `body`, `category` (ENUM), `faculty`, `status` (ENUM: draft/pending/under_review/published/rejected/archived/resolved), `votes` (INT DEFAULT 0), `search_vector` (TSVECTOR), `created_at`, `updated_at`, `published_at`. |
| 2.5 | Schema `evidence` | `id` (UUID PK), `report_id` (FK reports), `type` (ENUM: file/external_link), `file_key` (TEXT — Cloudinary public_id o URL externa), `mime_type`, `size_bytes`, `created_at`. |
| 2.6 | Schema `report_status_history` | `id`, `report_id` (FK), `old_status`, `new_status`, `changed_by_token`, `reason` (TEXT nullable), `created_at`. Inmutable. |
| 2.7 | Schema `votes` | `id`, `report_id` (FK), `token_id` (TEXT), `created_at`. `UNIQUE(report_id, token_id)`. |
| 2.8 | Schema `comments` | `id`, `report_id` (FK), `token_id`, `parent_id` (FK self, nullable, max 2 niveles), `body` (TEXT, max 1000), `created_at`. |
| 2.9 | Schema `moderation_log` | `id`, `report_id` (FK), `moderator_token`, `action` (ENUM: approve/reject/request_info/escalate), `reason`, `created_at`. **Sin UPDATE ni DELETE.** |
| 2.10 | Schema `notifications` | `id`, `token_id`, `type` (ENUM), `payload` (JSONB), `read` (BOOLEAN), `created_at`. |
| 2.11 | Schema `flags` | `id`, `report_id` (FK), `token_id`, `category` (ENUM), `description` (TEXT nullable), `created_at`. `UNIQUE(report_id, token_id)`. |
| 2.12 | Índices | GIN en `reports.search_vector`. B-tree en `reports.status`, `reports.category`, `reports.faculty`. Índice en `comments.report_id`. Índice en `votes.report_id`. |
| 2.13 | Trigger para search_vector | Auto-actualiza `search_vector` en INSERT/UPDATE de title+body. |
| 2.14 | Generar y ejecutar migración | `npx drizzle-kit generate` → `npx drizzle-kit migrate` contra Neon. |
| 2.15 | Script de seed para desarrollo | Insertar datos de prueba: 5 users, 5 anon profiles, 20 reports, 50 comments, 100 votes. |

### Criterio de "Terminado"

- [ ] Todas las tablas existen en Neon (`\dt` muestra 11 tablas)
- [ ] `drizzle-kit studio` muestra el schema completo
- [ ] Seed corre sin errores en local y en Neon
- [ ] Constraints verificados: no se puede insertar voto duplicado (`UNIQUE` constraint error)
- [ ] GIN index funciona: `SELECT * FROM reports WHERE search_vector @@ to_tsquery('corrupción')` retorna resultados
- [ ] Migration files versionados en `drizzle/migrations/`

### Commit: `feat(db): complete schema — 11 tables with indexes and migrations`

---

## Fase 3 — Autenticación & Anonimato

### Objetivo
> "Un usuario se registra en Clerk, y automáticamente se crea su token anónimo en nuestra DB. Su email NUNCA toca nuestra base de datos en texto plano."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 3.1 | Integrar Clerk en `apps/web` | `@clerk/nextjs` provider en layout. Sign In / Sign Up pages con componentes de Clerk. Middleware de Next.js para rutas protegidas. |
| 3.2 | Webhook `user.created` en `apps/api` | Endpoint `POST /webhooks/clerk`. Verifica firma con `svix`. Extrae email del payload. |
| 3.3 | Implementar HMAC-SHA256 email hashing | `email_hash = HMAC-SHA256(email.toLowerCase().trim(), ENCRYPTION_MASTER_KEY)`. Key desde Cloudflare Secrets. |
| 3.4 | Generar token anónimo (UUID v4) | Crear entrada en `anonymous_profiles` con `token_id = UUID v4` y `display_name` auto-generado. |
| 3.5 | Generar relation_proof | `relation_proof = HMAC-SHA256(email_hash + token_id, ENCRYPTION_RELATION_KEY)`. Guardar en `identity_links`. |
| 3.6 | Guardar token_id en Clerk publicMetadata | `clerkClient.users.updateUser(userId, { publicMetadata: { token_id } })`. Así el JWT incluye el token_id. |
| 3.7 | Insertar usuario en DB | `users` tabla: `clerk_id`, `email_hash`, `role: 'user'`, `faculty: null` (se establece en onboarding). |
| 3.8 | Auth middleware en Hono.js | Verificar JWT RS256 con public key de Clerk en cada request protegido. Extraer `token_id` del JWT. |
| 3.9 | Middleware de roles | `requireRole('moderator')`, `requireRole('admin')`. Valida `role` del JWT o consulta DB. |
| 3.10 | Rate limiting | 100 req/min por IP en endpoints públicos. 20 req/min en escrituras. 5 intentos de login fallidos → 15min bloqueo (Clerk lo maneja). |
| 3.11 | Configurar Cloudflare Secrets | `wrangler secret put ENCRYPTION_MASTER_KEY`, `wrangler secret put ENCRYPTION_RELATION_KEY` con las keys generadas. |
| 3.12 | Logout que invalida sesión | Clerk `signOut()` en frontend. Verificar que JWT viejo retorna 401. |
| 3.13 | Tests unitarios de auth | Test: webhook recibe email → DB tiene email_hash (no texto plano). Test: JWT inválido → 401. Test: role incorrecto → 403. Cobertura >80%. |

### Criterio de "Terminado"

- [ ] Registro en Clerk → webhook llega → `users` + `anonymous_profiles` + `identity_links` creados
- [ ] `SELECT email FROM users` → columna no existe (solo `email_hash`)
- [ ] `grep -r '@' database_dump` → cero resultados de emails
- [ ] JWT contiene `token_id` en claims (verificar en jwt.io)
- [ ] Endpoint protegido sin JWT → 401
- [ ] Endpoint de admin con JWT de user → 403
- [ ] Tests >80% coverage en módulo auth

### Commit: `feat(auth): Clerk integration + anonymous token architecture`

---

## Fase 4 — CRUD de Reportes (Sin Archivos)

### Objetivo
> "Un usuario autenticado puede crear un reporte (solo texto por ahora) y verlo en el feed público. El reporte SOLO referencia su token anónimo."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 4.1 | Zod schemas compartidos | `CreateReportSchema`: title (10-200), body (100-5000), category (enum), faculty (string). En `packages/shared`. |
| 4.2 | `POST /reports` | Validar con Zod. Extraer `token_id` del JWT. Insertar en DB con status `pending`. Retornar report con ID. **Por ahora sin evidencia obligatoria** (se agrega en F5). |
| 4.3 | `GET /reports` feed público | Cursor-based pagination (20/página). Solo status `published`. Filtros: category, faculty, date_from, date_to. Ordenar por `published_at DESC`. |
| 4.4 | `GET /reports/:id` | Público si `published`. Autor puede ver cualquier status. Moderador puede ver `under_review`/`pending`. |
| 4.5 | `GET /reports/mine` | Reportes del token_id del JWT. Todos los status. Paginados. |
| 4.6 | `PATCH /reports/:id` | Solo el autor (token_id match), solo si status es `draft`. Actualizar title/body. |
| 4.7 | Máquina de estados | Definir transiciones válidas en código: `draft→pending`, `pending→under_review`, `under_review→published/rejected`, etc. Rechazar transiciones inválidas. |
| 4.8 | Status history | En cada cambio de estado → INSERT en `report_status_history`. |
| 4.9 | Formulario de creación (frontend) | Multi-step form: Paso 1 (título + descripción), Paso 2 (categoría + facultad), Paso 3 (preview). **Paso de evidencia placeholder** (F5). |
| 4.10 | Feed component (frontend) | Cards con título, categoría, facultad, fecha, votes count. Infinite scroll con Intersection Observer. Skeleton loading. |
| 4.11 | Página de detalle (frontend) | Título, cuerpo completo, categoría badge, fecha, estado timeline, placeholder para evidencia y comentarios. |
| 4.12 | "Mis reportes" page (frontend) | Lista de reportes propios con estado actual (badge de color). |
| 4.13 | Tests de endpoints | POST sin auth → 401. POST con campos faltantes → 400. GET feed → array paginado. GET report ajeno → respeta permisos. |

### Criterio de "Terminado"

- [ ] Crear reporte con texto → aparece en DB con `token_id`, sin referencia a user
- [ ] Feed público muestra solo reportes `published`
- [ ] Cursor pagination funciona (next_cursor en response)
- [ ] Formulario frontend valida en tiempo real (Zod)
- [ ] Status history se registra en cada transición
- [ ] Tests de API con >80% coverage en módulo reports

### Commit: `feat(reports): CRUD endpoints + feed + status machine`

---

## Fase 5 — Pipeline de Evidencia

### Objetivo
> "Un usuario sube archivos que se comprimen y limpian en el NAVEGADOR, se verifican en el servidor, y se almacenan en Cloudinary. Los videos largos van como link externo."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 5.1 | Librería client-side processing | Hook `useMediaProcessor()` en React. Integrar: **piexifjs** (EXIF strip images), **Canvas API** (recomprimir a WebP ≤200KB), **pdf-lib** (strip PDF metadata), **MediaRecorder** (re-encode video ≤10s/500KB, audio ≤60s/300KB). |
| 5.2 | Componente de upload | Drag & drop zone. Preview de imágenes/PDFs. Progress bar. Muestra tamaño antes/después de compresión. Botón "Agregar link externo" (YouTube/Drive). |
| 5.3 | Input de links externos | Validar URL (YouTube, Google Drive). Guardar como `evidence.type = 'external_link'`. No consume créditos Cloudinary. |
| 5.4 | Backend: multipart upload handler | Recibir archivo comprimido. Verificar tipo por **magic bytes** (no extensión). Rechazar >5MB (422). |
| 5.5 | Backend: validar metadata residual | Verificar que NO quede EXIF en imágenes (si lo hay → 422 con mensaje "metadata detected, re-strip"). Verificar PDFs sin author/creator. |
| 5.6 | Backend: upload a Cloudinary | Upload firmado con UUID como `public_id`. Folder `mame/evidence/`. `strip_profile: true` como fallback. Retornar `file_key`. |
| 5.7 | Backend: guardar en `evidence` tabla | Insert: `report_id`, `type` (file/external_link), `file_key`, `mime_type`, `size_bytes`. |
| 5.8 | Hacer evidencia obligatoria | Actualizar `POST /reports` para requerir mínimo 1 archivo O 1 link externo. Frontend bloquea si no hay evidencia. Backend rechaza (400). |
| 5.9 | Mostrar evidencia en detalle de reporte | Galería de imágenes (lightbox), reproductor de video/audio embebido, iframe para links externos (YouTube embed), link para PDFs. |
| 5.10 | Tests de pipeline completo | Upload JPG con EXIF → EXIF stripped → Cloudinary. Upload sin strip → servidor rechaza 422. Upload >5MB → 422. Link externo YouTube → guardado sin upload. |

### Criterio de "Terminado"

- [ ] Imagen con EXIF → procesada client-side → EXIF = 0 en servidor
- [ ] Archivo >5MB → rechazado con error claro
- [ ] Link de YouTube → guardado como `external_link` en DB (0 créditos Cloudinary)
- [ ] No se puede crear reporte sin al menos 1 evidencia
- [ ] Progress bar visible durante upload
- [ ] Archivos en Cloudinary tienen UUID como nombre (original filename NO almacenado)

### Commit: `feat(evidence): client-side processing + Cloudinary upload + external links`

---

## Fase 6 — Moderación AI & Colas

### Objetivo
> "Contenido ilegal NUNCA llega a Cloudinary ni a moderación humana. Contenido aprobado entra a cola con delay aleatorio 1-6h antes de publicarse."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 6.1 | Workers AI: texto | Integrar `@cf/meta/llama-guard-3-8b`. Clasificar texto de título + body. Categorías: CSAM, drogas, armas, grooming, tráfico, violencia. Si detecta → REJECT inmediato. |
| 6.2 | Workers AI: imágenes | Integrar `@cf/meta/llama-3.2-11b-vision-instruct`. Analizar cada imagen subida. NSFW/violencia → REJECT. |
| 6.3 | Flujo de moderación tier-1 (síncrono) | Durante `POST /reports`: (1) analizar texto con Llama Guard, (2) analizar imágenes con Vision. Si ANY falla → status `REJECTED`, archivo NUNCA sube a Cloudinary, evidencia eliminada. Forensic log creado. |
| 6.4 | Flujo de moderación tier-2 (asíncrono) | Contenido que pasa tier-1 → status `pending` → entra a Cloudflare Queue para moderación de calidad/política. Queue consumer cambia status a `under_review`. |
| 6.5 | Cloudflare Queue: publicación con delay | Cuando moderador humano aprueba (F8) → `queue.send(reportId, { delaySeconds: random(3600, 21600) })`. Consumer cambia status a `published` y notifica al autor. |
| 6.6 | Forensic logging | Log de intentos rechazados: `token_id`, `timestamp`, `rejection_reason`, `ai_confidence_score`. SIN almacenar el contenido ilegal en sí. |
| 6.7 | Configurar KV para rate limiting | KV namespace para counters de rate limit. Batch writes. TTL automático. |
| 6.8 | Tests de moderación AI | Texto con keywords de drogas → REJECTED. Imagen safe → PASS. Texto legal + imagen safe → PENDING. Verificar que archivo rechazado NO está en Cloudinary. |

### Criterio de "Terminado"

- [ ] Texto ilegal → reporte REJECTED instantáneamente, sin archivo en Cloudinary
- [ ] Imagen NSFW → REJECTED, sin archivo en Cloudinary
- [ ] Contenido legal → status `pending` → llega a cola
- [ ] Queue consumer funciona: después de delay → status `published`
- [ ] Forensic log registra los rechazos (sin contenido ilegal)
- [ ] Rate limiting funciona: >10 reportes/día del mismo token → bloqueado

### Commit: `feat(moderation): Workers AI tier-1 + Queues tier-2 + publication delay`

---

## Fase 7 — CDN Proxy & Seguridad de Media

### Objetivo
> "Ningún usuario accede directo a Cloudinary. Todo pasa por nuestro CDN proxy con cache de 24h. Las URLs de evidencia son firmadas y temporales."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 7.1 | Worker de CDN proxy | Nuevo Worker `apps/cdn-proxy` (o ruta en api Worker). Intercepta requests a `/media/*`. Primero busca en Cloudflare Cache API. Si miss → fetch a Cloudinary con signed URL. Guardar en cache 24h. |
| 7.2 | Signed URLs con expiración | Generar URL firmada con `timestamp + signature`. Expiración configurable (1h default). Regenerar en cada request, nunca URLs permanentes. |
| 7.3 | Security headers middleware | Agregar a todas las responses: `Content-Security-Policy` (img-src: media.YOUR_DOMAIN.com), `Strict-Transport-Security` (max-age=31536000), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| 7.4 | CORS configuración | Whitelist de origins permitidos. Rechazar requests de origins desconocidos. |
| 7.5 | Actualizar frontend | Todos los `<img>` y `<video>` apuntan a CDN proxy, NUNCA a `res.cloudinary.com` directo. |
| 7.6 | Tests de cache | Primera request → cache MISS (fetch a Cloudinary). Segunda request → cache HIT (0 bandwidth Cloudinary). Headers de cache correctos. |

### Criterio de "Terminado"

- [ ] `Network` tab del browser nunca muestra `res.cloudinary.com` — solo tu dominio CDN proxy
- [ ] Primera carga de imagen: cache MISS → cargada desde Cloudinary
- [ ] Segunda carga: cache HIT → servida desde Cloudflare edge
- [ ] URL de evidencia expirada → 403
- [ ] Security headers presentes en TODAS las responses (verificar con securityheaders.com)

### Commit: `feat(cdn): media proxy worker + cache + signed URLs + security headers`

---

## Fase 8 — Panel de Moderación Humana

### Objetivo
> "Los moderadores tienen su propia interfaz para revisar, aprobar o rechazar reportes. No pueden moderar reportes de su propia facultad. Cada acción queda en un audit log inmutable."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 8.1 | Ruta protegida `/mod` (frontend) | Next.js layout con `requireRole('moderator')`. Sidebar con: Queue, Historial, Estadísticas rápidas. |
| 8.2 | Vista de cola de moderación | Lista de reportes con status `under_review`. Ordenados por fecha de creación (más antiguos primero). Preview: título, categoría, facultad, fecha, cantidad de evidencia. |
| 8.3 | Vista de detalle con acciones | Reporte completo + toda la evidencia. Botones: **Aprobar** (verde), **Rechazar** (rojo, con textarea obligatorio para razón), **Pedir más info** (amarillo), **Escalar a admin** (naranja). |
| 8.4 | Anti-conflict detection | Backend: comparar `moderator.faculty` con `report.faculty`. Si coinciden → reporte oculto de esa cola. Auto-reasignar. Frontend: ni siquiera aparece en la lista. |
| 8.5 | `PATCH /reports/:id/moderate` | Verificar JWT con role `moderator`. Verificar no-conflicto de facultad. Ejecutar acción. Insertar en `moderation_log`. Cambiar status del reporte. Si aprueba → enviar a Queue con delay. |
| 8.6 | Audit log inmutable | INSERT en `moderation_log` con: report_id, moderator_token, action, reason, timestamp. Tabla SIN UPDATE/DELETE permisos (REVOKE en DB). |
| 8.7 | Sistema de flags (reportes ciudadanos) | `POST /reports/:id/flag`. Categorías: reporte falso, contenido inapropiado, datos expuestos, acoso. 1 flag por usuario por reporte. Threshold (5 flags) → status cambia a `under_review` automáticamente. |
| 8.8 | Aprobación doble para categorías sensibles | Reportes de categoría "Acoso Sexual" requieren ≥2 moderadores que aprueben. Status intermedio `pending_second_review`. |
| 8.9 | Tests de moderación | Moderador aprueba → reporte entra a Queue → se publica con delay. Moderador de misma facultad → no ve el reporte. Rechazo sin razón → 400. Audit log tiene entrada inmutable. |

### Criterio de "Terminado"

- [ ] Moderador ve cola con reportes pendientes (excepto los de su facultad)
- [ ] Aprobar → reporte entra a Queue → se publica en 1-6h
- [ ] Rechazar sin razón → error (razón obligatoria)
- [ ] `moderation_log` tiene registro de CADA acción
- [ ] 5+ flags en un reporte → vuelve a `under_review`
- [ ] Reporte de acoso sexual requiere 2 aprobaciones

### Commit: `feat(moderation-panel): moderator UI + audit trail + anti-faculty-conflict`

---

## Fase 9 — Comunidad & Feed Público

### Objetivo
> "Los usuarios pueden interactuar con reportes publicados: comentar, votar, unirse como colaboradores, y recibir notificaciones."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| 9.1 | Comentarios CRUD | `POST /comments` (body, report_id, parent_id opcional). `GET /comments?report_id=X`. `DELETE /comments/:id` (solo autor). Max 1000 chars. Max 2 niveles de nesting. |
| 9.2 | Filtro AI en comentarios | Mismo pipeline de Workers AI (Llama Guard 3) para texto de comentarios. Rechazar si ilegal. |
| 9.3 | Componente de comentarios (frontend) | Árbol de comentarios con 2 niveles. Botón "Responder". Textarea con contador de caracteres. Auto-refresh o polling. |
| 9.4 | Sistema de votos | `POST /reports/:id/vote` y `DELETE /reports/:id/vote`. `UNIQUE(report_id, token_id)` en DB. Incrementar/decrementar `reports.votes` **en la misma transacción** que INSERT/DELETE en `votes`. |
| 9.5 | Botón de voto (frontend) | Botón con ícono + contador. Toggle: click para votar, click de nuevo para quitar. Optimistic update. |
| 9.6 | Reportes colaborativos ("me too") | `POST /reports/:id/support`. Aceptar descripción opcional + evidencia opcional. Contador público de supporters. Identidades individuales NO visibles. |
| 9.7 | In-app notifications | `GET /notifications?token_id=X`. Polling cada 30 segundos. Tipos: status_change, new_support, moderator_response, comment_reply. |
| 9.8 | Notification bell (frontend) | Ícono de campana en header. Badge con count de no leídas. Dropdown con lista. Click → marca como leída + navega al reporte. |
| 9.9 | Full-text search | `GET /reports/search?q=corrupción`. Usa GIN index + `ts_rank`. Resultados paginados con cursor. Highlight de coincidencias. |
| 9.10 | Search bar (frontend) | Input con debounce (300ms). Resultados en dropdown. Enter → página de resultados completa. |
| 9.11 | Feed con ISR caching | Configurar ISR (Incremental Static Regeneration) en pages de feed. `revalidate: 60` (1 min). Cloudflare Pages cachea las páginas estáticas. |
| 9.12 | Filtros avanzados en feed | Filtrar por: más votados, más recientes, más apoyados, categoría, facultad. Filtros persisten en URL params. |
| 9.13 | Tests de comunidad | Voto duplicado → error. Comentario con texto ilegal → rechazado. Notificación llega en <5min. Search devuelve resultados en <500ms. |

### Criterio de "Terminado"

- [ ] Comentar con 2 niveles de nesting funciona
- [ ] Comentario con texto ilegal → rechazado por AI
- [ ] Votar → contador sube. Votar de nuevo → error. Quitar voto → contador baja.
- [ ] Notificación aparece en <5 min después de cambio de estado
- [ ] Búsqueda "corrupción" devuelve resultados en <500ms
- [ ] Feed con ISR: primera carga desde CDN (fast), revalida cada 60s
- [ ] Filtros funcionan y persisten en URL

### Commit: `feat(community): comments, votes, search, notifications, ISR feed`

---

## Fase 10 — Polish, Seguridad & Lanzamiento

### Objetivo
> "MAME sale a producción pulido, seguro, performant, y listo para recibir los primeros 500 usuarios reales."

### Pasos

| # | Paso | Detalle |
|---|---|---|
| **UI/UX** | | |
| 10.1 | Responsive completo | Testear TODAS las páginas en: 320px, 375px, 768px, 1024px, 1440px. Touch targets ≥44x44px. Sin scroll horizontal. |
| 10.2 | Dark mode / Light mode | Toggle en header. Persistir preferencia en localStorage. Respetar `prefers-color-scheme` del sistema. |
| 10.3 | Landing page | Hero explicando MAME. "Cómo funciona" en 3 pasos visuales. FAQ collapsibloe. CTA de registro. |
| 10.4 | Onboarding de primer usuario | Modal/tour para usuario nuevo: "Así funciona MAME, así de anónimo eres". |
| 10.5 | Accesibilidad WCAG 2.1 AA | Correr axe-core en todas las páginas. Fijar contraste de colores. Navegación por teclado. Screen reader. |
| **Performance** | | |
| 10.6 | Lighthouse Mobile ≥ 85 | Lazy loading de imágenes. Code splitting con `next/dynamic`. `next/image` para toda imagen. `next/font`. |
| 10.7 | Core Web Vitals | LCP < 2.5s. FID < 100ms. CLS < 0.1. Verificar con PageSpeed Insights. |
| 10.8 | Bundle analysis | `@next/bundle-analyzer`. Identificar dependencias grandes. Tree-shake lo innecesario. |
| **Seguridad** | | |
| 10.9 | OWASP ZAP scan | Correr ZAP contra staging. Fijar TODOS los critical y high. Documentar medium/low con plan de mitigación. |
| 10.10 | Checklist DSS 24 items | Completar los 24 controles de seguridad (ver SECURITY.md) con evidencia. |
| 10.11 | Penetration testing manual | Intentar: SQL injection, XSS, CSRF, IDOR (acceder reporte ajeno), JWT tampering, file upload attacks. Documentar resultados. |
| **Testing** | | |
| 10.12 | k6 load test | Simular pico universitario: 275 concurrentes. Escenarios: browse feed (ISR), search, create report, vote. P95 < 200ms. Error rate < 1%. |
| 10.13 | E2E tests | Playwright: registro completo → crear reporte con evidencia → moderador aprueba → reporte aparece en feed → otro usuario comenta y vota. |
| **Admin** | | |
| 10.14 | Dashboard de estadísticas | Chart.js: reportes por categoría (barras), por mes (línea), por facultad (pie). Tiempos de moderación promedio. Tokens activos. |
| 10.15 | API docs OpenAPI 3.0 | Documentar todos los endpoints con request/response schemas. Disponible en `/api/docs`. |
| **Producción** | | |
| 10.16 | Deploy frontend a Cloudflare Pages | Conectar repo de GitHub. Build command: `npm run build --filter=web`. Output: `.next`. |
| 10.17 | Deploy API a Cloudflare Workers | `wrangler deploy` desde CI/CD. Verificar que Secrets están configurados. |
| 10.18 | Deploy CDN proxy Worker | Worker separado o ruta en API Worker. Verificado con test de cache. |
| 10.19 | Configurar dominio custom (opcional) | Si tienen dominio: DNS en Cloudflare → Pages + Workers. Si no: usar subdominios gratuitos de Cloudflare. |
| 10.20 | Monitoreo 48h post-deploy | Sentry activo. Verificar 0 errors críticos. Verificar que no hay PII en logs. Verificar rate limits. |
| 10.21 | Plan de respuesta a incidentes | Documento P0-P3. Quién responde. Cómo hacer rollback. Templates de comunicación. |
| 10.22 | Lanzamiento | Landing page live. Anuncio en universidad. Primeros 500 usuarios. Monitor Sentry 24/7 primera semana. |

### Criterio de "Terminado" (Launch Criteria)

- [ ] OWASP ZAP: 0 critical, 0 high
- [ ] k6: 275 concurrentes sin >20% degradación
- [ ] Lighthouse Mobile ≥ 85
- [ ] 24 controles DSS completados con evidencia
- [ ] OpenAPI docs completos en `/api/docs`
- [ ] 5+ beta testers completaron flujo completo (registro → reporte → interacción)
- [ ] Sentry activo capturando errores (sin PII)
- [ ] Plan de incidentes documentado
- [ ] E2E tests pasan al 100%

### Commits:
```
feat(ui): responsive + dark mode + landing page + accessibility
feat(perf): lighthouse optimization + ISR tuning + bundle optimization
fix(security): OWASP ZAP fixes + DSS checklist complete
feat(admin): statistics dashboard + OpenAPI docs
ci(deploy): production deployment pipeline
docs: incident response plan
```

---

## Resumen Visual del Flujo

```
F1 Scaffolding           ──→  Monorepo + CI/CD + Docker
     │
F2 Base de Datos         ──→  11 tablas en Neon + migraciones
     │
F3 Auth & Anonimato      ──→  Clerk + HMAC + JWT + tokens anónimos
     │
F4 CRUD Reportes         ──→  Crear/ver reportes (solo texto)
     │
F5 Pipeline Evidencia    ──→  Compresión client-side + Cloudinary + links externos
     │
F6 Moderación AI         ──→  Llama Guard + Llama Vision + Queues
     │
F7 CDN Proxy             ──→  Cache edge + signed URLs + security headers
     │
F8 Panel Moderación      ──→  UI moderadores + audit log + anti-conflicto
     │
F9 Comunidad             ──→  Comentarios + votos + búsqueda + notificaciones + ISR
     │
F10 Lanzamiento          ──→  Polish + seguridad + load test + DEPLOY 🚀
```

---

## Reglas de Oro

1. **No avanzar a la siguiente fase sin cumplir TODOS los criterios de "Terminado"** de la actual
2. **Commit al final de cada fase** con mensaje descriptivo
3. **Si algo no funciona en una fase**, se arregla ahí — no se arrastra deuda técnica
4. **Cada fase es deployable** — en cualquier punto puedes hacer deploy parcial y tener algo funcional
5. **Tests antes de avanzar** — no hay excusa para skipear tests entre fases

---

## Dependencias entre Fases

```
F1 ← INDEPENDIENTE (prerequisito de todo)
F2 ← F1
F3 ← F1, F2
F4 ← F3
F5 ← F4
F6 ← F5
F7 ← F5 (puede hacerse en paralelo con F6)
F8 ← F6
F9 ← F4, F8
F10 ← F1-F9 (todo completado)
```

> **Nota:** F6 y F7 pueden hacerse en paralelo si se quiere acelerar.
