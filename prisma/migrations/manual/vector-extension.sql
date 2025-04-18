-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- Create ResourceChunk table
CREATE TABLE IF NOT EXISTS "ResourceChunk" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "resourceId" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "embedding" vector(1536),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE
);

-- Add index on resourceId for faster lookups
CREATE INDEX IF NOT EXISTS "ResourceChunk_resourceId_idx" ON "ResourceChunk"("resourceId");

-- Update Resource model to add the relation (no change needed in the database structure) 