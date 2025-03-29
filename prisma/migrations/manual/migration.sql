-- Migration to update Resource table

-- Add fileSize column to Resource table
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;

-- Remove content column from Resource table
ALTER TABLE "Resource" DROP COLUMN IF EXISTS "content";

-- Remove sessionId column and its index from Resource table
DROP INDEX IF EXISTS "Resource_sessionId_idx";
ALTER TABLE "Resource" DROP COLUMN IF EXISTS "sessionId";
