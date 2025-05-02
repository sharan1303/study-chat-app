# Migrating from SSE to Redis with Server Actions

This document outlines the steps for migrating from Server-Sent Events (SSE) to Redis with Next.js Server Actions for chat functionality.

## Overview

We've replaced the SSE-based real-time updates with Redis and Server Actions which:

- Reduces memory consumption significantly
- Eliminates the need for constant connections
- Provides better performance and scalability
- Simplifies client-side state management

## Implementation Details

### 1. Redis Integration

- Created `lib/redis.ts` with Upstash Redis client and utility functions
- Set up data structures for chat storage and retrieval
- Implemented TTL (Time To Live) for automatic cache management
- Added fallback to PostgreSQL for data durability

### 2. Server Actions

- Created `app/actions/chat.ts` with Server Actions for:
  - Creating chats
  - Sending messages
  - Retrieving chat history
  - Deleting chats
- Added revalidation for real-time UI updates
- Implemented optimistic updates for better UX

### 3. Client Integration

- Created `hooks/useChatRedis.ts` to integrate with existing components
- Updated `components/Sidebar/ClientSidebar.tsx` to use Redis-based hooks
- Maintained backward compatibility with existing components
- Added optimistic UI updates for immediate feedback

### 4. Database Schema Updates

- Modified `prisma/schema.prisma` to add a `Message` model
- Changed Chat model to link to Message model

## Setup Instructions

1. Add Redis environment variables to `.env.local`:

```
REDIS_URL=https://your-upstash-redis-instance.upstash.io
REDIS_TOKEN=your-upstash-redis-token
```

2. Run database migrations:

```
npx prisma migrate dev --name add_message_model
```

3. Generate Prisma client:

```
npx prisma generate
```

## Usage

With this implementation:

1. Chat state is managed through Server Actions
2. UI updates are triggered through client mutations and path revalidation
3. Data persists in both Redis (for speed) and PostgreSQL (for durability)

To create a new chat:

```typescript
import { startNewChat } from "@/hooks/useChatRedis";

// In your component
const { startNewChat } = useChatRedis();

// Create a new chat
startNewChat({ title: "My New Chat" });
```

To fetch chat history:

```typescript
import { useChats } from "@/hooks/useChatRedis";

// In your component
const { chats, isLoading } = useChatRedis();
```

## Troubleshooting

If you encounter issues:

1. Check Redis connection by monitoring the console logs for "Redis connection successful"
2. Verify environment variables are correctly set
3. Ensure Prisma schema matches your database schema
4. Run `npx prisma generate` after schema changes

For database drift issues, consider:

```
npx prisma migrate reset  # Warning: This will delete all data
```

## Rollback Plan

If needed, you can revert to SSE by:

1. Removing Redis integration
2. Restoring original SSE event handlers in ClientSidebar.tsx
3. Removing Server Actions and hooks
4. Verifying database schema compatibility
