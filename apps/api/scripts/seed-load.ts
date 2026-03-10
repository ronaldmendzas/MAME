import { randomUUID } from 'node:crypto'

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

import * as schema from '../src/infrastructure/db/schema/index'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const sql = postgres(DATABASE_URL)
const db = drizzle(sql, { schema })

const TOTAL = 10_000
const BATCH = 500

const categories = schema.reportCategoryEnum.enumValues
const faculties = ['Engineering', 'Medicine', 'Law', 'Sciences', 'Arts']

async function seedLoad() {
  console.log(`Seeding ${TOTAL} reports in batches of ${BATCH}...`)

  const tokenId = randomUUID()
  await db.insert(schema.anonymousProfiles).values({
    tokenId,
    displayName: 'LoadTestUser',
    reputationScore: 0,
  })

  for (let batch = 0; batch < TOTAL / BATCH; batch++) {
    const values = Array.from({ length: BATCH }, (_, i) => {
      const idx = batch * BATCH + i
      return {
        id: randomUUID(),
        tokenId,
        title: `Load test report ${idx}: ${categories[idx % categories.length]}`,
        body: `Body for load test report #${idx}. Testing search performance with tsvector.`,
        category: categories[idx % categories.length],
        faculty: faculties[idx % faculties.length],
        status: 'published' as const,
        publishedAt: new Date(Date.now() - idx * 1000),
      }
    })
    await db.insert(schema.reports).values(values)
    console.log(`  Batch ${batch + 1}/${TOTAL / BATCH} done`)
  }
  console.log('Load seed complete!')
}

seedLoad().then(() => sql.end()).catch(console.error)
