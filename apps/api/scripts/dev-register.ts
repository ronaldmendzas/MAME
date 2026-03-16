import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../src/infrastructure/db/schema/index'

const DATABASE_URL = process.env['DATABASE_URL']
const CLERK_SECRET_KEY = process.env['CLERK_SECRET_KEY']
const CLERK_USER_ID = process.argv[2]

if (!DATABASE_URL) throw new Error('DATABASE_URL required')
if (!CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY required')
if (!CLERK_USER_ID) throw new Error('Usage: npx tsx scripts/dev-register.ts <clerk_user_id>')

const sql = postgres(DATABASE_URL)
const db = drizzle(sql, { schema })

async function findExistingToken(clerkId: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.clerkId, clerkId))
  if (!user) return null
  const [link] = await db.select().from(schema.identityLinks).where(eq(schema.identityLinks.emailHash, user.emailHash))
  return link?.tokenId ?? null
}

async function insertNewUser(clerkId: string, tokenId: string) {
  const emailHash = `dev_hash_${randomUUID().slice(0, 16)}`
  const displayName = `Citizen-${Math.floor(1000 + Math.random() * 9000)}`

  await db.insert(schema.users).values({ clerkId, emailHash, role: 'user' })
  await db.insert(schema.anonymousProfiles).values({ tokenId, displayName })
  await db.insert(schema.identityLinks).values({
    emailHash,
    tokenId,
    relationProof: `dev_proof_${randomUUID().slice(0, 16)}`,
  })
  console.log(`  User + profile created: ${displayName} (${tokenId})`)
}

async function updateClerkMetadata(clerkUserId: string, tokenId: string) {
  const res = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}/metadata`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_metadata: { token_id: tokenId, role: 'user' } }),
  })
  if (!res.ok) throw new Error(`Clerk update failed: ${res.status} ${await res.text()}`)
  console.log(`  Clerk metadata updated: token_id=${tokenId}`)
}

async function devRegister() {
  console.log(`Registering: ${CLERK_USER_ID}`)

  const existingToken = await findExistingToken(CLERK_USER_ID)
  const tokenId = existingToken ?? randomUUID()

  if (!existingToken) await insertNewUser(CLERK_USER_ID, tokenId)
  else console.log(`  User already in DB, tokenId: ${tokenId}`)

  await updateClerkMetadata(CLERK_USER_ID, tokenId)
  console.log('Done! Sign out and sign back in at localhost:3000')
  await sql.end()
}

devRegister().catch((e) => { console.error(e); process.exit(1) })
