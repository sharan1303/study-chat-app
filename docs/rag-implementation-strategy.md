# RAG Implementation Strategy using Vercel AI SDK and Google Gemini

## Overview

This document outlines the strategy for implementing a Retrieval Augmented Generation (RAG) system using Vercel AI SDK with Google Gemini 2.0 Flash as the AI model. The system will enable the Study Chat application to understand uploaded documents and provide more relevant and accurate responses based on document content.

## Current Architecture

The Study Chat app currently has:

1. **Resource Management**: Users can upload files to modules, stored in Supabase
2. **Chat Interface**: Using Vercel AI SDK with Google Gemini 2.0 Flash
3. **Database**: PostgreSQL with Prisma ORM

## RAG Implementation Plan

### 1. Database Schema Changes

We'll extend the existing database schema to support vector embeddings:

```sql
-- Create extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to Resource table
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- Add chunks table for document splitting
CREATE TABLE "ResourceChunk" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(768),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ResourceChunk_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ResourceChunk_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index for similarity search
CREATE INDEX "ResourceChunk_embedding_idx" ON "ResourceChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 2. Document Processing Pipeline

1. **Document Upload**: Enhance the existing upload route to trigger document processing
2. **Document Loading**: Parse uploaded documents based on type (PDF, DOCX, TXT, etc.)
3. **Text Chunking**: Split documents into manageable chunks (~1000 tokens each)
4. **Embedding Generation**: Generate vector embeddings for each chunk using Google's text-embedding-004 model
5. **Storage**: Store chunks and embeddings in the database

### 3. Tool Calling Implementation

We'll implement tool calling with the Vercel AI SDK to allow the model to:

1. **Search Documents**: Query the vector database for relevant chunks
2. **Fetch Document Metadata**: Get document titles, types, and other metadata
3. **Citation**: Generate proper citations for information retrieved from documents

### 4. User Interface Enhancements

1. **Source Citations**: Display source information for responses
2. **Filtering**: Allow users to specify which documents to query
3. **Relevance Indicators**: Show relevance scores for retrieved information

## Technical Implementation Details

### 1. Document Processing Service

```typescript
// lib/rag/documentProcessor.ts
export async function processDocument(resource: Resource) {
  // 1. Load document content based on type
  const content = await loadDocumentContent(resource);

  // 2. Split into chunks
  const chunks = splitIntoChunks(content);

  // 3. Generate embeddings
  const embeddedChunks = await generateEmbeddings(chunks);

  // 4. Store in database
  await storeChunks(resource.id, embeddedChunks);
}
```

### 2. Embedding Generation

```typescript
// lib/rag/embeddings.ts
import { google } from "@ai-sdk/google";

export async function generateEmbeddings(texts: string[]) {
  const embedder = google.textEmbeddingModel("text-embedding-004");

  const embeddings = await Promise.all(
    texts.map(async (text) => {
      const embedding = await embedder.embed(text);
      return {
        text,
        embedding: embedding.embedding,
      };
    })
  );

  return embeddings;
}
```

### 3. RAG Chat API

```typescript
// app/api/chat/rag/route.ts
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
  // Extract messages, chat context
  const { messages, moduleId } = await request.json();

  // Set up tool definitions
  const tools = [
    {
      name: "search_documents",
      description: "Search documents for relevant information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
          moduleId: {
            type: "string",
            description: "Optional: The module ID to search within",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return",
          },
        },
        required: ["query"],
      },
    },
  ];

  // Stream response with tool calling
  const stream = streamText({
    model: google("gemini-2.0-flash"),
    messages,
    tools,
    temperature: 0.2,
    toolCallBehavior: "auto",
  });

  return stream.toDataStreamResponse();
}
```

### 4. Tool Implementation

```typescript
// lib/rag/tools.ts
export async function searchDocuments(
  query: string,
  moduleId?: string,
  limit: number = 5
) {
  // Generate embedding for query
  const embedding = await generateQueryEmbedding(query);

  // Perform vector similarity search
  const results = await prisma.$queryRaw`
    SELECT 
      rc."id", 
      rc."content", 
      rc."resourceId",
      r."title" as "resourceTitle",
      r."type" as "resourceType",
      1 - (rc."embedding" <=> ${embedding}::vector) as "similarity"
    FROM "ResourceChunk" rc
    JOIN "Resource" r ON rc."resourceId" = r."id"
    WHERE ${
      moduleId ? Prisma.sql`r."moduleId" = ${moduleId} AND` : Prisma.sql``
    }
      1 - (rc."embedding" <=> ${embedding}::vector) > 0.7
    ORDER BY similarity DESC
    LIMIT ${limit};
  `;

  return results;
}
```

## Integration with Existing UI

We'll integrate the RAG functionality with minimal changes to the existing UI:

1. Add "Search Your Documents" option in chat interface
2. Display source citations in chat responses
3. Add a toggle for enabling/disabling RAG in chat settings

## User Experience

1. **Upload Flow**: No changes to the existing upload UI
2. **Chat Interface**: Same interface with added source citations
3. **Module Context**: RAG automatically uses documents from the current module

## Deployment Plan

1. **Database Migration**: Add the vector extension and new tables
2. **Document Processing**: Implement processing pipeline for new uploads
3. **Backfill**: Process existing documents
4. **API Updates**: Implement RAG-enabled chat API
5. **UI Enhancements**: Add citation display in chat UI

## Next Steps & Considerations

1. **Performance**: Monitor vector search performance and optimize as needed
2. **Large Documents**: Implement chunking strategies for very large documents
3. **Cross-Module Search**: Allow searching across all modules when needed
4. **Model Fine-tuning**: Consider fine-tuning Gemini on specific domains

## Conclusion

This RAG implementation leverages the existing architecture of the Study Chat application while adding powerful document understanding capabilities. By using Vercel AI SDK with Google Gemini and tool calling, we can create a seamless experience that provides more accurate and context-aware responses based on uploaded study materials.
