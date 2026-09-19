-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RequestedPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ITPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter TicketStatus Enum
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'WAITING_FOR_REQUESTER';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'REOPENED';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- CreateTable users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'REQUESTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Data Migration from RequesterUser if table exists
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'RequesterUser') THEN
        INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "isActive", "mustChangePassword", "createdAt", "updatedAt")
        SELECT "id", "name", "email", '$2a$10$rPMXy6CZEV8N8zMTeWuIQ.cckdneKWk.T24BN6vNWRqwhWK1Gvaxa', 'REQUESTER', "isActive", false, "createdAt", "updatedAt"
        FROM "RequesterUser"
        ON CONFLICT ("email") DO NOTHING;
    END IF;
END $$;

-- Rename Ticket table to tickets if exists
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Ticket') THEN
        ALTER TABLE "Ticket" RENAME TO "tickets";
    END IF;
END $$;

-- Drop legacy foreign keys
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "Ticket_requesterId_fkey";

-- Add columns to tickets
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "itPriority" "ITPriority" NOT NULL DEFAULT 'MEDIUM';

-- Foreign key constraints on tickets
ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_requesterId_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_ownerId_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop legacy RequesterUser table
DROP TABLE IF EXISTS "RequesterUser" CASCADE;

-- Create Indexes on tickets
CREATE INDEX IF NOT EXISTS "tickets_requesterId_idx" ON "tickets"("requesterId");
CREATE INDEX IF NOT EXISTS "tickets_ownerId_idx" ON "tickets"("ownerId");
CREATE INDEX IF NOT EXISTS "tickets_currentStatus_idx" ON "tickets"("currentStatus");
CREATE INDEX IF NOT EXISTS "tickets_itPriority_idx" ON "tickets"("itPriority");

-- CreateTable public_comments
CREATE TABLE IF NOT EXISTS "public_comments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "public_comments_ticketId_idx" ON "public_comments"("ticketId");

ALTER TABLE "public_comments" DROP CONSTRAINT IF EXISTS "public_comments_ticketId_fkey";
ALTER TABLE "public_comments" ADD CONSTRAINT "public_comments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public_comments" DROP CONSTRAINT IF EXISTS "public_comments_authorId_fkey";
ALTER TABLE "public_comments" ADD CONSTRAINT "public_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable internal_notes
CREATE TABLE IF NOT EXISTS "internal_notes" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "internal_notes_ticketId_idx" ON "internal_notes"("ticketId");

ALTER TABLE "internal_notes" DROP CONSTRAINT IF EXISTS "internal_notes_ticketId_fkey";
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "internal_notes" DROP CONSTRAINT IF EXISTS "internal_notes_authorId_fkey";
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
