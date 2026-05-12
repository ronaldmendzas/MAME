-- Migration: harden anonymity by removing plaintext mapping from identity_links
-- Adds anonymous_token_id to users for operational recovery
-- Removes email_hash and token_id from identity_links (keep only relation_proof)

-- Step 1: Add anonymous_token_id to users (nullable for backward compatibility during transition)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "anonymous_token_id" text;

-- Step 2: Migrate existing data: copy token_id from identity_links to users via email_hash
-- This preserves operational recovery capability while removing the plaintext link
UPDATE "users"
SET "anonymous_token_id" = "identity_links"."token_id"
FROM "identity_links"
WHERE "users"."email_hash" = "identity_links"."email_hash";

-- Step 3: Verify migration (should be zero rows if all users got their token)
-- SELECT id, clerk_id, email_hash, anonymous_token_id FROM users WHERE anonymous_token_id IS NULL;

-- Step 4: Remove plaintext columns from identity_links
-- Note: We keep relation_proof which is the one-way HMAC that requires both keys to reverse
ALTER TABLE "identity_links" DROP COLUMN IF EXISTS "email_hash";
ALTER TABLE "identity_links" DROP COLUMN IF EXISTS "token_id";

-- Step 5: Add unique constraint on relation_proof to prevent duplicates
ALTER TABLE "identity_links" ADD CONSTRAINT "identity_links_relation_proof_unique" UNIQUE ("relation_proof");

-- Step 6: Add index on users.anonymous_token_id for fast lookups
CREATE INDEX IF NOT EXISTS "users_anonymous_token_id_idx" ON "users" ("anonymous_token_id");
