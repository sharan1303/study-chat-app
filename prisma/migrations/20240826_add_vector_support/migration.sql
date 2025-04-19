-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to Resource table
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- Create ResourceChunk table
CREATE TABLE "ResourceChunk" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "embedding" vector(768) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ResourceChunk_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ResourceChunk_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index for similarity search
CREATE INDEX "ResourceChunk_embedding_idx" ON "ResourceChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for faster resource lookup
CREATE INDEX "ResourceChunk_resourceId_idx" ON "ResourceChunk"("resourceId"); 