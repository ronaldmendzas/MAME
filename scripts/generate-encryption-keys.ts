import { randomBytes } from 'node:crypto'

function generateKey(name: string): void {
  const key = randomBytes(64).toString('hex')
  console.log(`${name}=${key}`)
}

console.log('# Add these to Cloudflare Secrets or .env.local')
console.log('# Generated at:', new Date().toISOString())
console.log('')
generateKey('ENCRYPTION_MASTER_KEY')
generateKey('ENCRYPTION_RELATION_KEY')
