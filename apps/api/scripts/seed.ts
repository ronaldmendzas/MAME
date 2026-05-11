import { randomUUID } from 'node:crypto'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../src/infrastructure/db/schema/index'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const sql = postgres(DATABASE_URL)
const db = drizzle(sql, { schema })

function uuid() {
  return randomUUID()
}

async function seed() {
  console.log('Seeding database...')

  const userIds = Array.from({ length: 5 }, () => uuid())
  const tokenIds = Array.from({ length: 5 }, () => uuid())

  await db.insert(schema.users).values(
    userIds.map((id, i) => ({
      id,
      clerkId: `clerk_${id.slice(0, 8)}`,
      emailHash: `hash_${id.slice(0, 16)}`,
      role: i === 0 ? ('admin' as const) : i === 1 ? ('moderator' as const) : ('user' as const),
      faculty: ['Engineering', 'Medicine', 'Law', 'Sciences', 'Arts'][i],
      verified: true,
    })),
  )
  console.log('  5 users inserted')

  await db.insert(schema.anonymousProfiles).values(
    tokenIds.map((tokenId, i) => ({
      tokenId,
      displayName: `Ciudadano-${1000 + i}`,
      reputationScore: i * 10,
    })),
  )
  console.log('  5 anonymous profiles inserted')

  await db.insert(schema.identityLinks).values(
    userIds.map((_, i) => ({
      emailHash: `hash_${userIds[i].slice(0, 16)}`,
      tokenId: tokenIds[i],
      relationProof: `proof_${uuid().slice(0, 16)}`,
    })),
  )
  console.log('  5 identity links inserted')

  const categories = schema.reportCategoryEnum.enumValues
  const faculties = ['Engineering', 'Medicine', 'Law', 'Sciences', 'Arts']
  const reportIds: string[] = []
  const reportValues = []

  for (let i = 0; i < 20; i++) {
    const reportId = uuid()
    reportIds.push(reportId)
    reportValues.push({
      id: reportId,
      tokenId: tokenIds[i % 5],
      title: `Test Report ${i + 1}: ${categories[i % categories.length]}`,
      body: `This is the body of test report number ${i + 1}. It contains enough text to test the full-text search functionality with the tsvector trigger. Category: ${categories[i % categories.length]}.`,
      category: categories[i % categories.length],
      faculty: faculties[i % 5],
      status: (i < 10 ? 'published' : i < 15 ? 'pending' : 'under_review') as 'published' | 'pending' | 'under_review',
      publishedAt: i < 10 ? new Date() : null,
    })
  }
  await db.insert(schema.reports).values(reportValues)
  console.log('  20 reports inserted')

  const commentValues = []
  for (let i = 0; i < 50; i++) {
    commentValues.push({
      reportId: reportIds[i % 20],
      tokenId: tokenIds[i % 5],
      body: `Comment ${i + 1} on report.`,
    })
  }
  await db.insert(schema.comments).values(commentValues)
  console.log('  50 comments inserted')

  const voteValues = []
  for (let r = 0; r < 20 && voteValues.length < 100; r++) {
    for (let t = 0; t < 5 && voteValues.length < 100; t++) {
      voteValues.push({
        reportId: reportIds[r],
        tokenId: tokenIds[t],
      })
    }
  }
  await db.insert(schema.votes).values(voteValues)
  console.log(`  ${voteValues.length} votes inserted`)

  console.log('Seed complete!')
}

seed().then(() => sql.end()).catch(console.error)
