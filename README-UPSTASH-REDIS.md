# Upstash Redis Integration

This document explains the integration of Upstash Redis with the Study Chat App.

## Overview

We've integrated Upstash Redis as a real-time, cloud-based Redis database to improve performance and reliability of the chat application. This implementation provides:

1. Improved real-time messaging performance
2. Reliable state management across serverless functions
3. Fault tolerance with a hybrid PostgreSQL + Redis approach

## Configuration

The application uses the following environment variables for Upstash Redis:

```shell
REDIS_URL=https://united-elf-30104.upstash.io
REDIS_TOKEN=your_redis_token
```

## Architecture

### Hybrid Data Strategy

We've implemented a hybrid data approach:

1. **Redis**: Fast, in-memory database for:

   - Active chat sessions
   - Real-time event broadcasting
   - SSE client management
   - Recent chat history

2. **PostgreSQL**: Durable storage for:
   - Long-term chat history
   - User data
   - Module content

This approach provides the speed of Redis with the durability of PostgreSQL.

### Key Redis Features

1. **Chat Storage and Retrieval**

   - Chats stored in Redis for fast access
   - Fallback to PostgreSQL if not found in Redis

2. **Real-time Event Broadcasting**

   - Events published through Redis Pub/Sub
   - Cross-instance communication for robust scalability

3. **SSE Connection Management**
   - Client connections tracked in Redis
   - Allows load balancing across multiple instances

## Implementation Details

### Chat API Routes

All chat API endpoints now use Redis as the primary storage mechanism:

1. **chat/route.ts**: Main chat endpoint for message processing

   - Stores chat data in Redis
   - Uses Redis for publishing events
   - Falls back to PostgreSQL for compatibility

2. **chat/[id]/route.ts**: Individual chat retrieval

   - Gets chat by ID from Redis first
   - Falls back to PostgreSQL if not found

3. **chat/history/route.ts**: Chat history retrieval

   - Gets chat history from Redis
   - Falls back to PostgreSQL for older chats

4. **chat/clear/route.ts**: Chat deletion
   - Removes chats from both Redis and PostgreSQL
   - Uses Redis to broadcast deletion events

### Events System

The events system now uses Redis Pub/Sub:

1. **events.ts**: Core event broadcasting

   - Uses Redis for cross-instance event publishing
   - Falls back to in-memory broadcasting if Redis fails

2. **api/events/route.ts**: SSE endpoint
   - Registers clients in Redis
   - Subscribes to Redis channels for events
   - Manages client connections with Redis TTLs

## Advantages of Upstash Redis

1. **Serverless Compatible**: Designed for serverless architectures with connection pooling
2. **Global Replication**: Low-latency access worldwide
3. **Simple Pricing**: Pay-per-use model that scales with your application
4. **REST API**: HTTP-based access when needed (not used in this implementation)
5. **No Connection Management**: Handles thousands of simultaneous connections

## Operational Notes

- The application now stores data in both Redis and PostgreSQL for reliability
- All events are broadcast through Redis first, with in-memory fallback
- Redis handles SSE client tracking with automatic expiration of inactive clients

## Development and Testing

For local development:

1. Set the `REDIS_URL` to your Upstash Redis instance URL
2. Set the `REDIS_TOKEN` to your Upstash Redis password
3. Start the application as normal

## Monitoring

Monitor Redis performance using the Upstash dashboard:

- Connection counts
- Memory usage
- Command statistics

## Troubleshooting

If you encounter issues with Redis:

1. Check the Upstash console for connection status
2. Verify environment variables are set correctly
3. The application will fall back to PostgreSQL if Redis is unavailable
