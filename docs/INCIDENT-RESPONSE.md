# Plan de Respuesta a Incidentes — MAME

> Última actualización: 2026-05-11
> Versión: 1.0
> Clasificación: Confidencial — Equipo técnico únicamente

---

## 1. Clasificación de Severidad

| Nivel | Descripción | Ejemplos | Tiempo de respuesta objetivo |
|-------|-------------|----------|------------------------------|
| **P0 — Crítico** | Compromiso de seguridad, anonimato roto, data breach | DB expuesta, claves filtradas, anonimato violado | 15 minutos |
| **P1 — Alto** | Vulnerabilidad activa, abuso masivo | XSS/CSRF en producción, spam masivo, DDoS | 1 hora |
| **P2 — Medio** | Degradación de servicio, falsos positivos | Performance < objetivo, moderación AI fallando | 4 horas |
| **P3 — Bajo** | Bug menor, mejora UX | Typos, fallos cosméticos, mejoras menores | 24 horas |

---

## 2. Contactos y Escalación

| Rol | Nombre / Canal | Método de contacto |
|-----|----------------|-------------------|
| **Líder técnico** | Canal `#mame-alerts` (Discord/Slack) | Mensaje directo + mention `@here` |
| **Founder / Super Admin** | WhatsApp grupo `MAME Core` | Llamada directa para P0 |
| **Equipo de seguridad** | GitHub Projects + Issues etiquetadas `security` | Auto-asignación por rotación |
| **Proveedores** | Clerk, Cloudflare, Neon, Sentry | Ver sección 6 |

**Regla de escalación:**
- P0: Notificar inmediatamente a líder técnico + founder
- P1: Notificar a líder técnico en 15 minutos
- P2/P3: Registrar en GitHub Projects, asignar en daily standup

---

## 3. Procedimiento por Severidad

### 3.1 P0 — Crítico

```
T+0min   DETECCIÓN
         → Confirmar el incidente con 2 fuentes independientes
         → Abrir canal de guerra (Discord/Meet) con líder + founder
         → Designar Incident Commander (IC)

T+15min  CONTENCIÓN
         → Rotar claves comprometidas (ver checklist sección 5)
         → Desactivar endpoints afectados si es necesario
         → Activar modo mantenimiento en Cloudflare Pages si aplica
         → Snapshot de DB (Neon branch) para forense

T+1h     INVESTIGACIÓN
         → Revisar security_event_log para actor/token afectado
         → Revisar Sentry (si está activo) para stack traces
         → Identificar vector de ataque y alcance

T+4h     REMEDIACIÓN
         → Aplicar patch/fix
         → Verificar fix con tests
         → Deploy a staging, luego producción
         → Monitorear 24h con Sentry/logs

T+24h    COMUNICACIÓN
         → Post-mortem interno
         → Si afecta usuarios: comunicación por landing page / status page
         → Si es legal: consultar con asesor legal antes de comunicar

T+72h    REVISIÓN
         → Actualizar este documento con lecciones aprendidas
         → Agregar tests de regresión para el vector atacado
```

### 3.2 P1 — Alto

```
T+0min   DETECCIÓN → Confirmar y documentar en GitHub Issue `security`
T+15min  CONTENCIÓN → Rate limiting, bloqueo de IP/token abusivo
T+1h     INVESTIGACIÓN → Reproducir en local/staging
T+4h     REMEDIACIÓN → Patch + deploy
T+24h    COMUNICACIÓN → Issue cerrado con RCA (Root Cause Analysis)
```

### 3.3 P2 — Medio

```
T+0      DETECCIÓN → GitHub Issue `bug` o `performance`
T+4h     INVESTIGACIÓN → Reproducir, identificar hotspot
T+24h    REMEDIACIÓN → Fix + deploy
```

### 3.4 P3 — Bajo

```
Backlog estándar. Resolver en siguiente sprint.
```

---

## 4. Escenarios Específicos

### 4.1 Credenciales filtradas (C1 del Sprint 4)

**Impacto:** P0

**Checklist de rotación inmediata:**
- [ ] Clerk.dev → Settings → API Keys → Rotate Secret Key
- [ ] Clerk.dev → Webhooks → Regenerate Webhook Secret
- [ ] Neon.tech → Connection string → Reset password
- [ ] Cloudinary → Settings → Security → Regenerate API Secret
- [ ] Resend → API Keys → Revoke + Create new
- [ ] Sentry → Project Settings → Security → Rotate DSN
- [ ] Cloudflare → API Tokens → Revoke + Create new
- [ ] Actualizar `ENCRYPTION_MASTER_KEY` y `ENCRYPTION_RELATION_KEY` (re-encriptar identity_links)
- [ ] Verificar que ninguna clave antigua funcione con `curl` a cada servicio
- [ ] Notificar al equipo por canal interno

### 4.2 Anonimato comprometido

**Impacto:** P0 — EL PEOR ESCENARIO

**Hypothesis:** Alguien logró vincular `email_hash` con `token_id`.

**Acciones:**
1. Congelar inmediatamente el endpoint de búsqueda (`/reports/search`)
2. Revisar `security_event_log` para accesos no autorizados a `identity_links`
3. Verificar que `ENCRYPTION_MASTER_KEY` y `ENCRYPTION_RELATION_KEY` no hayan sido expuestas
4. Si las claves de encriptación están comprometidas:
   - Generar nuevas claves
   - Recomputar todos los `email_hash` y `relation_proof`
   - Esto requiere downtime planificado
5. Notificar a asesor legal antes de cualquier comunicación externa
6. Documentar todo para posible requerimiento judicial

### 4.3 DB comprometida

**Impacto:** P0

**Acciones:**
1. Rotar password de Neon inmediatamente
2. Crear branch de Neon para forense (`neon branch create`)
3. Revisar `security_event_log` para queries anómalas
4. Verificar que no hay emails en plaintext (grep por `@` en dump)
5. Si hay evidencia de acceso a `identity_links`: ver escenario 4.2

### 4.4 XSS/CSRF activo

**Impacto:** P1

**Acciones:**
1. Identificar endpoint vulnerable
2. Aplicar CSP más restrictivo temporalmente
3. Sanitizar input con DOMPurify
4. Verificar que `HttpOnly`, `Secure`, `SameSite=Strict` están en cookies
5. Agregar tests de regresión

### 4.5 DDoS / Abuso de API

**Impacto:** P1

**Acciones:**
1. Activar rate limiting más agresivo en Cloudflare WAF
2. Bloquear IPs abusivas en Cloudflare Firewall Rules
3. Escalar Workers Paid si se supera el límite de 100K/día
4. Verificar que KV rate limit está funcionando

---

## 5. Rollback y Recovery

### Rollback de deploy

```bash
# Cloudflare Workers
wrangler rollback --name mame-api --version <previous-version>

# Cloudflare Pages
# Re-deploy commit anterior desde GitHub Actions o dashboard
```

### Recovery de DB

```bash
# Neon branching para recovery
neonctl branches create --name recovery-$(date +%s) --parent production
neonctl branches reset --name production --parent recovery-<timestamp>
```

### Verificación post-recovery

- [ ] Health check `GET /health` responde 200
- [ ] Auth funciona (login + token generation)
- [ ] Feed carga correctamente
- [ ] Evidence URLs firmadas funcionan
- [ ] Sentry no reporta nuevos errores (si está activo)

---

## 6. Contactos de Proveedores

| Proveedor | URL de status | Soporte | Datos sensibles que manejan |
|-----------|---------------|---------|----------------------------|
| **Clerk.dev** | status.clerk.dev | Intercom chat | Emails (plaintext en su infra) |
| **Cloudflare** | cloudflarestatus.com | Dashboard ticket | Workers, KV, logs de tráfico |
| **Neon.tech** | neonstatus.com | Intercom | DB completa (solo hashes en MAME) |
| **Cloudinary** | status.cloudinary.com | Support ticket | Archivos de evidencia |
| **Resend** | resend.com | Email | Emails de admin alerts |
| **Sentry** | sentry.statuspage.io | Dashboard | Stack traces (sin PII) |

---

## 7. Comunicación Interna

### Template de alerta P0

```
🚨 INCIDENTE P0 — MAME

Fecha/Hora: {{timestamp}}
Detectado por: {{name}}
Impacto: {{breve descripción}}
Servicios afectados: {{lista}}
Acciones tomadas: {{lista}}
IC asignado: {{name}}
Estado: INVESTIGANDO / CONTENIDO / RESUELTO

Canal de guerra: {{Discord/Meet link}}
```

### Template de comunicación a usuarios (si aplica)

```
MAME — Aviso de seguridad

Hemos identado y resuelto un incidente de seguridad que afectó [descripción breve].

Qué pasó: [descripción no técnica]
Qué datos se vieron afectados: [si ninguno, decirlo explícitamente]
Qué hicimos: [acciones tomadas]
Qué estamos haciendo: [medidas preventivas]

Tu anonimato [sigue protegido / está bajo investigación].

Contacto: [email de soporte]
```

**IMPORTANTE:** Nunca revelar detalles técnicos que puedan ayudar a un atacante. Nunca confirmar la existencia de `identity_links` o `email_hash` en comunicaciones públicas.

---

## 8. Post-Mortem

Cada P0 y P1 requiere post-mortem dentro de 72h.

**Formato:**
1. Resumen ejecutivo (2 oraciones)
2. Timeline exacto (T+0, T+15, T+1h, etc.)
3. Causa raíz (5 Whys)
4. Impacto medible (usuarios afectados, tiempo de downtime, datos expuestos)
5. Acciones correctivas (qué se hizo)
6. Acciones preventivas (qué se hará para evitar recurrencia)
7. Lecciones aprendidas
8. Propietario de cada acción preventiva + deadline

**Distribución:**
- Equipo técnico completo (15+ estudiantes)
- Founder / Super Admin
- Asesor legal (si aplica)

---

## 9. Checklist de Lanzamiento (Pre-Go-Live)

- [ ] Sentry activo y PII-safe
- [ ] Backups automáticos de Neon configurados (cada 6h)
- [ ] `wrangler.toml` con rollback version habilitado
- [ ] Neon branching probado (crear + reset)
- [ ] Todas las claves rotadas en los últimos 90 días
- [ ] Este documento revisado y aprobado por 2 founders
- [ ] Simulacro P0 realizado (tabletop exercise)
- [ ] Contactos de proveedores verificados (todos responden)

---

> **MAME — La seguridad no es un producto, es un proceso.**
