import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const sql = neon(DATABASE_URL)

async function main() {
  console.log('Creating search_vector trigger...')

  await sql(`
    CREATE OR REPLACE FUNCTION update_search_vector()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.body, '')), 'B');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `)

  await sql(`DROP TRIGGER IF EXISTS trg_reports_search_vector ON reports`)

  await sql(`
    CREATE TRIGGER trg_reports_search_vector
      BEFORE INSERT OR UPDATE OF title, body ON reports
      FOR EACH ROW
      EXECUTE FUNCTION update_search_vector()
  `)

  console.log('Done — trigger trg_reports_search_vector created')
}

main().catch(console.error)
