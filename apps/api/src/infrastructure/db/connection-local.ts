import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema/index'

export function createLocalDb(databaseUrl: string) {
  const client = postgres(databaseUrl)
  return drizzle(client, { schema })
}
