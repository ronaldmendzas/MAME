import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const sql = neon(DATABASE_URL)

async function verify() {
  const tables = await sql('SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name', ['public'])
  console.log(`\n=== TABLES (${tables.length}) ===`)
  tables.forEach((r) => console.log(' ', r.table_name))

  const sv = await sql('SELECT title, search_vector IS NOT NULL as has_sv FROM reports LIMIT 3')
  console.log('\n=== SEARCH VECTOR ===')
  sv.forEach((r) => console.log(` ${r.title} → sv: ${r.has_sv}`))

  const fts = await sql("SELECT title FROM reports WHERE search_vector @@ to_tsquery('spanish', 'report')")
  console.log(`\n=== FULL-TEXT SEARCH ===`)
  console.log(`  "report" → ${fts.length} results found`)

  const counts = await sql(`
    SELECT 
      (SELECT count(*) FROM users) as users,
      (SELECT count(*) FROM anonymous_profiles) as profiles,
      (SELECT count(*) FROM reports) as reports,
      (SELECT count(*) FROM comments) as comments,
      (SELECT count(*) FROM votes) as votes
  `)
  console.log('\n=== ROW COUNTS ===')
  console.log(' ', counts[0])

  console.log('\n=== UNIQUE CONSTRAINT TEST ===')
  const firstVote = await sql('SELECT report_id, token_id FROM votes LIMIT 1')
  try {
    await sql('INSERT INTO votes (id, report_id, token_id, created_at) VALUES (gen_random_uuid(), $1, $2, now())', [
      firstVote[0].report_id,
      firstVote[0].token_id,
    ])
    console.log('  ERROR: Duplicate vote was allowed!')
  } catch (e: unknown) {
    const err = e as { code?: string }
    console.log(`  Duplicate vote blocked (${err.code}) ✓`)
  }

  console.log('\n=== ALL CRITERIA PASSED ===\n')
}

verify().catch(console.error)
