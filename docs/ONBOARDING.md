# 🚀 Guía de Onboarding — Cuentas y Credenciales

> **Instrucciones paso a paso** para crear todas las cuentas necesarias para MAME.
>
> **Solo necesitas hacer lo que está en este documento** (crear cuentas en el navegador y copiar credenciales).
> Todo lo demás (scaffolding, configuración, código) se hace por consola.

---

## Resumen: 7 Cuentas a Crear

| # | Plataforma | Enlace | Tiempo estimado | ¿CC? |
|---|---|---|---|---|
| 1 | GitHub | [github.com](https://github.com) | 2 min (ya tienes) | NO |
| 2 | Neon.tech | [neon.tech](https://neon.tech) | 5 min | NO |
| 3 | Cloudflare | [cloudflare.com](https://cloudflare.com) | 5 min | NO |
| 4 | Clerk.dev | [clerk.com](https://clerk.com) | 5 min | NO |
| 5 | Cloudinary | [cloudinary.com](https://cloudinary.com) | 3 min | NO |
| 6 | Resend | [resend.com](https://resend.com) | 3 min | NO |
| 7 | Sentry | [sentry.io](https://sentry.io) | 3 min | NO |

**Total: ~25 minutos.**

---

## Cuenta 1 — GitHub ✅ (Ya la tienes)

Ya tienes cuenta: `ronaldmendzas`. Ya tienes el repo: `https://github.com/ronaldmendzas/MAME.git`.

**Qué me pasas:** Nada, ya está listo.

---

## Cuenta 2 — Neon.tech (Base de Datos PostgreSQL)

### Paso 1: Crear cuenta
1. Ve a **[neon.tech](https://neon.tech)**
2. Click en **"Sign Up"** → **"Continue with GitHub"** (usa tu cuenta `ronaldmendzas`)
3. Acepta los permisos

### Paso 2: Crear proyecto
1. Click **"Create a project"**
2. Configurar:
   - **Project name:** `mame-production`
   - **Database name:** `mame_db`
   - **PostgreSQL version:** `16`
   - **Region:** `us-east-1` (o `sa-east-1` si estás en Sudamérica — elige el más cercano)
3. Click **"Create project"**

### Paso 3: Copiar la connection string
> ⚠️ **IMPORTANTE:** La connection string completa se muestra SOLO UNA VEZ al crear el proyecto. Cópiala inmediatamente.

La verás en formato:
```
postgresql://neondb_owner:AbCdEf123456@ep-cool-name-123456.us-east-1.aws.neon.tech/mame_db?sslmode=require
```

### Qué me pasas:
```
DATABASE_URL = postgresql://...la-connection-string-completa...
```

---

## Cuenta 3 — Cloudflare (Workers, Pages, KV, Queues, AI)

### Paso 1: Crear cuenta
1. Ve a **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)**
2. Regístrate con tu email y una contraseña segura
3. Verifica tu email (revisa spam)

### Paso 2: Anotar tu Account ID
1. En el dashboard, ve a **Workers & Pages** (menú izquierdo)
2. En la parte derecha o en la URL, verás tu **Account ID** (algo como `a1b2c3d4e5f6...`)
3. Cópialo

### Paso 3: Crear un API Token
1. Ve a **[dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)**
2. Click **"Create Token"**
3. Selecciona **"Edit Cloudflare Workers"** template
4. Deja los permisos por defecto → **"Continue to summary"** → **"Create Token"**
5. ⚠️ **Copia el token inmediatamente** (se muestra solo una vez)

### Qué me pasas:
```
CLOUDFLARE_ACCOUNT_ID = a1b2c3d4e5...
CLOUDFLARE_API_TOKEN = tu-token-aquí
```

> **NO** necesitas crear Workers, KV, ni Queues manualmente. Eso lo haré yo por consola con `wrangler`.

---

## Cuenta 4 — Clerk.dev (Autenticación)

### Paso 1: Crear cuenta
1. Ve a **[clerk.com](https://clerk.com)**
2. Click **"Start building for free"** → **"Continue with GitHub"**

### Paso 2: Crear aplicación
1. Click **"Create application"** (o te lo pide al entrar por primera vez)
2. **Application name:** `MAME`
3. En **Sign-in methods**, activa:
   - ✅ **Email address** (obligatorio)
   - ✅ **Google** (opcional pero recomendado)
   - ✅ **GitHub** (opcional)
4. Click **"Create application"**

### Paso 3: Copiar API Keys
1. Después de crear la app, te lleva al **Dashboard**
2. En la sección "API Keys" (o Settings → API Keys) verás:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
   CLERK_SECRET_KEY = sk_test_...
   ```
3. Copia AMBAS

### Paso 4: Configurar Webhook (esto lo haremos después juntos)
> No lo hagas ahora — necesitamos primero la URL del Worker desplegado. Volveremos a este paso.

### Qué me pasas:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
CLERK_SECRET_KEY = sk_test_...
```

---

## Cuenta 5 — Cloudinary (Almacenamiento de Evidencia)

### Paso 1: Crear cuenta
1. Ve a **[cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)**
2. Regístrate con tu email (o **"Sign up with GitHub"**)
3. **NO** pide tarjeta de crédito

### Paso 2: Copiar credenciales del Dashboard
1. Al entrar al Dashboard, verás una sección **"Product Environment Credentials"** o **"API Environment variable"**
2. Copia los 3 valores:
   ```
   CLOUDINARY_CLOUD_NAME = dxxxxxxx
   CLOUDINARY_API_KEY = 123456789012345
   CLOUDINARY_API_SECRET = AbCdEfGhIjKlMnOpQrStUv
   ```

### Paso 3: Habilitar Strict Transformations
1. Ve a **Settings** (ícono de engranaje) → **Security**
2. Busca **"Strict transformations"** → **Actívalo** (Enable)
3. Esto asegura que todas las URLs de evidencia requieren firma

### Qué me pasas:
```
CLOUDINARY_CLOUD_NAME = dxxxxxxx
CLOUDINARY_API_KEY = 123456789012345
CLOUDINARY_API_SECRET = AbCdEfGhIjKlMnOpQrStUv
```

---

## Cuenta 6 — Resend (Email para alertas admin)

### Paso 1: Crear cuenta
1. Ve a **[resend.com](https://resend.com)**
2. Click **"Start building"** → **"Continue with GitHub"**

### Paso 2: Crear API Key
1. En el Dashboard, ve a **"API Keys"** (menú izquierdo)
2. Click **"Create API Key"**
3. **Name:** `MAME Production`
4. **Permission:** Full Access
5. Click **"Add"**
6. ⚠️ **Copia la API key inmediatamente** (se muestra solo una vez):
   ```
   RESEND_API_KEY = re_...
   ```

### Qué me pasas:
```
RESEND_API_KEY = re_...
```

---

## Cuenta 7 — Sentry (Monitoreo de errores)

### Paso 1: Crear cuenta
1. Ve a **[sentry.io](https://sentry.io)**
2. Click **"Start for free"** → **"Continue with GitHub"**

### Paso 2: Crear organización
1. **Organization Name:** `mame-foro`
2. Plan: **Developer** (free — se selecciona automáticamente)

### Paso 3: Crear Proyecto 1 (Frontend)
1. Click **"Create Project"**
2. **Platform:** busca y selecciona **"Next.js"**
3. **Project name:** `mame-frontend`
4. Click **"Create Project"**
5. Te mostrará un **DSN** (Data Source Name). Cópialo:
   ```
   NEXT_PUBLIC_SENTRY_DSN = https://abc123@o456789.ingest.sentry.io/1234567
   ```

### Paso 4: Crear Proyecto 2 (Backend)
1. Ve a **Settings** → **Projects** → **"Create Project"**
2. **Platform:** busca y selecciona **"JavaScript"** (para Cloudflare Workers)
3. **Project name:** `mame-backend`
4. Click **"Create Project"**
5. Copia el DSN:
   ```
   SENTRY_DSN_BACKEND = https://def456@o456789.ingest.sentry.io/7654321
   ```

### Paso 5: Configurar Data Scrubbing (Privacidad)
1. Ve a **Settings** → **Security & Privacy**
2. Activa ✅ **"Scrub data"**
3. Activa ✅ **"Scrub IP addresses"**
4. En **"Additional sensitive fields"**, agrega: `email`, `token`, `password`

### Qué me pasas:
```
NEXT_PUBLIC_SENTRY_DSN = https://...@...ingest.sentry.io/...
SENTRY_DSN_BACKEND = https://...@...ingest.sentry.io/...
```

---

## Resumen Final — Todo lo que me tienes que pasar

Cuando termines las 7 cuentas, pásame **un solo mensaje** con todo esto:

```
# === Neon.tech ===
DATABASE_URL = postgresql://...

# === Cloudflare ===
CLOUDFLARE_ACCOUNT_ID = ...
CLOUDFLARE_API_TOKEN = ...

# === Clerk.dev ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
CLERK_SECRET_KEY = sk_test_...

# === Cloudinary ===
CLOUDINARY_CLOUD_NAME = ...
CLOUDINARY_API_KEY = ...
CLOUDINARY_API_SECRET = ...

# === Resend ===
RESEND_API_KEY = re_...

# === Sentry ===
NEXT_PUBLIC_SENTRY_DSN = https://...
SENTRY_DSN_BACKEND = https://...
```

> ⚠️ **SEGURIDAD:** Después de pasarme las credenciales y confirmar que todo funciona, **borra el mensaje** de nuestra conversación. Nunca guardes credenciales en chats.

---

## ¿Qué hago yo mientras tanto?

Mientras creas las cuentas, yo por consola:

1. ✅ Creo el monorepo (Turborepo + `apps/web` + `apps/api` + `packages/shared`)
2. ✅ Configuro TypeScript strict, ESLint, Prettier
3. ✅ Creo Docker Compose para PostgreSQL local
4. ✅ Escribo los schemas de Drizzle (las 10 tablas)
5. ✅ Creo el `wrangler.toml`
6. ✅ Creo el `.env.example`
7. ✅ Configuro GitHub Actions CI/CD
8. ✅ Configuro husky + commitlint (Conventional Commits)

Cuando me pases las credenciales:

9. Configuro los Cloudflare Secrets (`wrangler secret put`)
10. Genero las `ENCRYPTION_MASTER_KEY` y `ENCRYPTION_RELATION_KEY`
11. Creo las KV namespaces y Queues
12. Ejecuto las migraciones en Neon
13. Hago el primer deploy a Cloudflare Pages + Workers
14. Configuramos juntos el webhook de Clerk

---

> **Tiempo estimado para ti:** ~25 minutos creando cuentas.
> **Tiempo estimado para mí:** ~15 minutos de scaffolding por consola (lo hago en paralelo).
