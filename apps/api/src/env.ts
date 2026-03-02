export interface Env {
  DATABASE_URL: string
  ENCRYPTION_MASTER_KEY: string
  ENCRYPTION_RELATION_KEY: string
  ENVIRONMENT: string
  CLERK_SECRET_KEY: string
  CLERK_WEBHOOK_SECRET: string
  CLOUDINARY_CLOUD_NAME: string
  CLOUDINARY_API_KEY: string
  CLOUDINARY_API_SECRET: string
  RESEND_API_KEY: string
  SENTRY_DSN: string
  RATE_LIMIT_KV: KVNamespace
}

export interface AppVariables {
  userId: string
  tokenId: string
  userRole: string
}

export type AppEnv = { Bindings: Env; Variables: AppVariables }
