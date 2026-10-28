-- =============================================================================
-- Lab 4 Rollback / Recovery Script
-- Reversible Down-Migration for Lab 4 Schema Evolution
-- =============================================================================

-- 1. Drop the child actions_taken table with cascading constraints
DROP TABLE IF EXISTS "actions_taken" CASCADE;

-- 2. Drop the added indexes and columns from tickets table
DROP INDEX IF EXISTS "tickets_resolvedAt_idx";
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "resolvedAt";
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "closedAt";
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "resolutionSummary";

-- Reverts cleanly back to Lab 3 schema state without touching existing users,
-- tickets, categories, related systems, attachments, comments, or internal notes.
