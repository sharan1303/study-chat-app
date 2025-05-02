import { Redis } from "@upstash/redis";

// Initialize Redis client with environment variables
const redis = new Redis({
  url: process.env.REDIS_URL || "",
  token: process.env.REDIS_TOKEN || "",
});

// Test connection
const testConnection = async () => {
  try {
    await redis.ping();
    console.log("✅ Redis connection successful");
    return true;
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }
    // Check if environment variables are present
    console.error(`Redis URL defined: ${!!process.env.REDIS_URL}`);
    console.error(`Redis token defined: ${!!process.env.REDIS_TOKEN}`);
    return false;
  }
};

// Chat-related Redis functions
export const CHAT_KEY_PREFIX = "chat:";
export const MESSAGE_KEY_PREFIX = "messages:";
export const USER_CHATS_KEY_PREFIX = "user:chats:";

// TTL settings (in seconds)
const CHAT_TTL = 60 * 60 * 24 * 30; // 30 days
const MESSAGE_TTL = 60 * 60 * 24 * 30; // 30 days

// Function to generate Redis keys
export const getChatKey = (chatId: string) => `${CHAT_KEY_PREFIX}${chatId}`;
export const getMessagesKey = (chatId: string) =>
  `${MESSAGE_KEY_PREFIX}${chatId}`;
export const getUserChatsKey = (userId: string) =>
  `${USER_CHATS_KEY_PREFIX}${userId}`;

// Store chat in Redis
export const storeChat = async (chat: any) => {
  if (!chat || !chat.id) {
    console.warn("Cannot store chat: Missing chat or chat.id");
    return null;
  }

  try {
    const chatKey = getChatKey(chat.id);
    console.log(`Storing chat in Redis: ${chatKey}`, {
      chatId: chat.id,
      hasUserId: !!chat.userId,
      hasSessionId: !!chat.sessionId,
    });

    // Test Redis connection before attempting to store
    try {
      await redis.ping();
      console.log("Redis connection confirmed before storing chat");
    } catch (pingError) {
      console.error("Redis connection failed before storing chat:", pingError);
      // Log detailed Redis connection info
      if (pingError instanceof Error) {
        console.error(
          `Ping error name: ${pingError.name}, message: ${pingError.message}`
        );
        console.error(`Stack trace: ${pingError.stack}`);
      }
      return chat; // Return chat data but don't attempt storage
    }

    // Add chat with TTL
    await redis.set(chatKey, JSON.stringify(chat), { ex: CHAT_TTL });
    console.log(`Chat successfully stored in Redis with key: ${chatKey}`);

    // Add to user's chat list if userId exists
    if (chat.userId) {
      const userChatsKey = getUserChatsKey(chat.userId);
      await redis.zadd(userChatsKey, { score: Date.now(), member: chat.id });
      console.log(`Chat added to user's chat list with key: ${userChatsKey}`);
    } else {
      console.log(
        `No userId present (${chat.userId}), not adding to user's chat list`
      );
    }

    return chat;
  } catch (error) {
    console.error("Error storing chat in Redis:", error);
    // Log detailed error info
    if (error instanceof Error) {
      console.error(
        `Redis error details - Name: ${error.name}, Message: ${error.message}`
      );
      console.error(`Stack trace: ${error.stack}`);
    }
    // Continue execution even if Redis fails
    return chat;
  }
};

// Get chat from Redis
export const getChat = async (chatId: string) => {
  if (!chatId) return null;

  try {
    const chatKey = getChatKey(chatId);
    console.log(`Fetching chat from Redis: ${chatKey}`);
    const chatData = await redis.get(chatKey);

    if (!chatData) {
      console.log(`Chat not found in Redis: ${chatKey}`);
      return null;
    }

    // Refresh TTL
    await redis.expire(chatKey, CHAT_TTL);
    console.log(`Chat found in Redis and TTL refreshed: ${chatKey}`);

    return typeof chatData === "string" ? JSON.parse(chatData) : chatData;
  } catch (error) {
    console.error(`Error getting chat ${chatId} from Redis:`, error);
    if (error instanceof Error) {
      console.error(
        `Error details - Name: ${error.name}, Message: ${error.message}`
      );
    }
    return null;
  }
};

// Store message in Redis
export const storeMessage = async (chatId: string, message: any) => {
  if (!chatId || !message || !message.id) return null;

  try {
    const messagesKey = getMessagesKey(chatId);
    console.log(`Storing message in Redis for chat: ${chatId}`, {
      messageId: message.id,
      role: message.role,
    });

    // Store the message in a sorted set with its timestamp as score
    const timestamp = message.createdAt
      ? new Date(message.createdAt).getTime()
      : Date.now();

    await redis.zadd(messagesKey, {
      score: timestamp,
      member: JSON.stringify(message),
    });
    await redis.expire(messagesKey, MESSAGE_TTL);
    console.log(`Message successfully stored in Redis: ${message.id}`);

    return message;
  } catch (error) {
    console.error(`Error storing message for chat ${chatId} in Redis:`, error);
    if (error instanceof Error) {
      console.error(
        `Error details - Name: ${error.name}, Message: ${error.message}`
      );
    }
    return message; // Return the message even if Redis storage fails
  }
};

// Get messages for a chat
export const getChatMessages = async (
  chatId: string,
  limit = 50,
  offset = 0
) => {
  if (!chatId) return [];

  try {
    const messagesKey = getMessagesKey(chatId);
    console.log(`Fetching messages from Redis for chat: ${chatId}`, {
      limit,
      offset,
    });

    // Get messages sorted by time (newest first for offset calculation)
    const totalCount = await redis.zcard(messagesKey);

    if (totalCount === 0) {
      console.log(`No messages found in Redis for chat: ${chatId}`);
      return [];
    }

    // Calculate bounds for ZRANGE
    const start = offset;
    const end = offset + limit - 1;

    // Get messages with ZRANGE, sorted by time ascending
    const messages = await redis.zrange(messagesKey, start, end);
    console.log(
      `Retrieved ${messages.length} messages from Redis for chat: ${chatId}`
    );

    // Refresh TTL
    await redis.expire(messagesKey, MESSAGE_TTL);

    // Parse messages from strings to objects
    return messages.map((message) =>
      typeof message === "string" ? JSON.parse(message) : message
    );
  } catch (error) {
    console.error(
      `Error fetching messages for chat ${chatId} from Redis:`,
      error
    );
    if (error instanceof Error) {
      console.error(
        `Error details - Name: ${error.name}, Message: ${error.message}`
      );
    }
    return []; // Return empty array on error
  }
};

// Get recent chats for a user
export const getUserChats = async (userId: string, limit = 20, offset = 0) => {
  if (!userId) return [];

  try {
    const userChatsKey = getUserChatsKey(userId);
    console.log(`Fetching recent chats from Redis for user: ${userId}`, {
      limit,
      offset,
    });

    // Get chat IDs ordered by most recent activity
    const chatIds = await redis.zrange(userChatsKey, 0, limit - 1, {
      rev: true,
    });

    if (!chatIds || chatIds.length === 0) {
      console.log(`No chat IDs found in Redis for user: ${userId}`);
      return [];
    }

    console.log(`Found ${chatIds.length} chat IDs for user: ${userId}`);

    // Get chat details for each ID
    const chats = await Promise.all(
      chatIds.map(async (chatId) => await getChat(chatId as string))
    );

    // Filter out any null results (chats that might have been deleted)
    return chats.filter(Boolean);
  } catch (error) {
    console.error(`Error fetching chats for user ${userId} from Redis:`, error);
    if (error instanceof Error) {
      console.error(
        `Error details - Name: ${error.name}, Message: ${error.message}`
      );
    }
    return []; // Return empty array on error
  }
};

// Delete a chat and its messages
export const deleteChat = async (chatId: string, userId?: string) => {
  if (!chatId) return false;

  const chatKey = getChatKey(chatId);
  const messagesKey = getMessagesKey(chatId);

  try {
    console.log(`Deleting chat from Redis: ${chatKey}`);

    // Delete chat and messages
    const [chatDeleted, messagesDeleted] = await Promise.all([
      redis.del(chatKey),
      redis.del(messagesKey),
    ]);

    console.log(
      `Deletion results - Chat: ${chatDeleted}, Messages: ${messagesDeleted}`
    );

    // Remove from user's chat list if userId provided
    if (userId) {
      const userChatsKey = getUserChatsKey(userId);
      const removed = await redis.zrem(userChatsKey, chatId);
      console.log(`Removed from user's chat list: ${removed} items`);
    }

    return true;
  } catch (error) {
    console.error(`Redis error deleting chat ${chatId}:`, error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error(
        `Error details - Name: ${error.name}, Message: ${error.message}`
      );
      console.error(`Stack trace: ${error.stack}`);
    }
    // Rethrow to allow proper handling upstream
    throw error;
  }
};

// Initialize Redis connection
testConnection().catch(console.error);

export default redis;
