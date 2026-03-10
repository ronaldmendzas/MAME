import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

import * as schema from './schema/index'

export function createDb(databaseUrl: string) {
  if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
    neonConfig.wsProxy = () => 'localhost:5433/v1'
    neonConfig.useSecureWebSocket = false
    neonConfig.pipelineTLS = false
    neonConfig.pipelineConnect = false
  }
  const pool = new Pool({ connectionString: databaseUrl })
  return drizzle(pool, { schema })
}

export type Database = ReturnType<typeof createDb>
