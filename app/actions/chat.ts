"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {
  storeChat,
  getChat,
  getChatMessages,
  storeMessage,
  getUserChats,
  deleteChat as redisDeleteChat,
} from "@/lib/redis";
import { formatChatTitle, generateId } from "@/lib/utils";
import { getModuleContext } from "@/lib/modules";
import { Message } from "ai";
import { Prisma } from "@prisma/client";

// Types
interface ChatCreationParams {
  title: string;
  moduleId?: string | null;
  sessionId?: string | null;
  messages?: Message[];
  optimisticChatId?: string;
}

interface SendMessageParams {
  chatId: string;
  content: string | any[];
  role: "user" | "assistant" | "system";
  moduleId?: string | null;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  chatId: string;
  createdAt: Date;
}

// Helper function to ensure either userId or sessionId is available
async function getUserIdentifiers() {
  const { userId } = await auth();
  const userObj = await currentUser();
  return {
    userId,
    userEmail: userObj?.emailAddresses[0]?.emailAddress || null,
    userName: userObj?.firstName
      ? `${userObj.firstName} ${userObj.lastName || ""}`
      : null,
  };
}

// Create a new chat
export async function createChat(params: ChatCreationParams) {
  const { userId, userEmail, userName } = await getUserIdentifiers();

  // Use existing or generate new ID
  const chatId = params.optimisticChatId || generateId();

  console.log(
    `createChat called with userId: ${userId}, chatId: ${chatId}, optimisticChatId: ${params.optimisticChatId}, sessionId: ${params.sessionId}`
  );

  try {
    // Prepare chat object
    const chatData = {
      id: chatId,
      title: params.title || "New Chat",
      moduleId: params.moduleId || null,
      userId: userId || null,
      sessionId: !userId ? params.sessionId || null : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("Creating chat with data:", {
      id: chatId,
      title: params.title || "New Chat",
      hasMessages: !!params.messages?.length,
      userId: userId || null,
      sessionId: !userId ? params.sessionId || null : null,
    });

    // Store in Redis first for immediate access
    try {
      console.log(`Calling storeChat for chatId: ${chatId}`);
      const storedChat = await storeChat(chatData);
      console.log(`Chat stored in Redis? ${!!storedChat}`);
    } catch (redisError) {
      console.error(
        "Redis error in createChat, continuing with database:",
        redisError
      );
      // Continue with database creation even if Redis fails
    }

    // Then persist to database
    const createData: any = {
      id: chatId,
      title: params.title || "New Chat",
      moduleId: params.moduleId || null,
      sessionId: !userId ? params.sessionId || null : null,
    };

    // Only add user relation if userId exists
    if (userId) {
      createData.user = {
        connectOrCreate: {
          where: { id: userId },
          create: {
            id: userId,
            email: userEmail || "user@example.com",
            name: userName || "Anonymous User",
          },
        },
      };
    }

    const chat = await prisma.chat.create({
      data: createData,
      include: {
        module: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    // Store initial messages if provided
    if (params.messages && params.messages.length > 0) {
      console.log(
        `Adding ${params.messages.length} initial messages to chat ${chatId}`
      );
      for (const message of params.messages) {
        try {
          await sendMessage({
            chatId,
            content: message.content,
            role: message.role as "user" | "assistant" | "system",
            moduleId: params.moduleId || null,
          });
        } catch (messageError) {
          console.error(
            `Error adding message to chat ${chatId}:`,
            messageError
          );
          // Continue with other messages
        }
      }
    }

    // Revalidate to update UI
    revalidatePath("/chat");
    revalidatePath(`/chat/${chatId}`);

    return chat;
  } catch (error) {
    console.error("Error creating chat:", error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }

    throw new Error(
      `Failed to create chat: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Send a message to a chat
export async function sendMessage(params: SendMessageParams) {
  const { chatId, content, role, moduleId } = params;
  const { userId } = await getUserIdentifiers();

  try {
    // Generate message ID
    const messageId = generateId();

    // Format content
    const formattedContent =
      typeof content === "string" ? content : JSON.stringify(content);

    // Create message object
    const messageData = {
      id: messageId,
      role,
      content: formattedContent,
      chatId,
      createdAt: new Date(),
    };

    // Store in Redis first
    await storeMessage(chatId, messageData);

    // Then persist to database
    const message = await prisma.message.create({
      data: {
        id: messageId,
        role,
        content: formattedContent,
        chatId,
      },
    });

    // Check if this is a user message
    if (role === "user") {
      // Get the chat from database to ensure we have the latest data
      const chatFromDb = await prisma.chat.findUnique({
        where: { id: chatId },
      });

      // Also check Redis
      const chatFromRedis = await getChat(chatId);

      // Determine if we should update the title (either no title or still default)
      const shouldUpdateTitle =
        !chatFromDb?.title ||
        chatFromDb.title === "New Chat" ||
        (chatFromRedis &&
          (!chatFromRedis.title || chatFromRedis.title === "New Chat"));

      if (shouldUpdateTitle) {
        console.log(`Updating title for chat ${chatId} based on user message`);

        // Format title from message content
        const newTitle = formatChatTitle(
          typeof content === "string" ? content : content[0]?.text || "New Chat"
        );

        console.log(`New title: ${newTitle}`);

        // Update chat title in PostgreSQL
        await prisma.chat.update({
          where: { id: chatId },
          data: {
            title: newTitle,
            updatedAt: new Date(),
          },
        });

        // If we have Redis chat data, update it too
        if (chatFromRedis) {
          await storeChat({ ...chatFromRedis, title: newTitle });
        }
      } else {
        // Just update the updatedAt timestamp
        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });
      }
    }

    // Revalidate to update UI
    revalidatePath("/chat");
    revalidatePath(`/chat/${chatId}`);

    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
}

// Get chat history
export async function getChatHistory(limit = 20, cursor?: string) {
  const { userId } = await getUserIdentifiers();

  try {
    // Try to get from Redis first for authenticated users
    if (userId) {
      const redisChats = await getUserChats(userId, limit);

      // If we have data in Redis, use it
      if (redisChats && redisChats.length > 0) {
        return {
          chats: redisChats,
          pagination: {
            hasMore: redisChats.length === limit,
            nextCursor:
              redisChats.length === limit
                ? redisChats[redisChats.length - 1].id
                : null,
          },
        };
      }
    }

    // Fall back to database if Redis doesn't have the data
    // Build where clause based on authentication state
    const where: Prisma.ChatWhereInput = {};
    if (userId) {
      where.userId = userId;
    } else {
      // Anonymous users not supported in this implementation
      return {
        chats: [],
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      };
    }

    // Fetch chats with pagination
    const chats = await prisma.chat.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit + 1, // Take one more to check if there are more chats
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor
      }),
      include: {
        module: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    // Check if there are more chats
    const hasMore = chats.length > limit;
    const displayChats = hasMore ? chats.slice(0, limit) : chats;

    // Next cursor is the ID of the last chat
    const nextCursor = hasMore
      ? displayChats[displayChats.length - 1].id
      : null;

    // Cache these chats in Redis for faster access next time
    for (const chat of displayChats) {
      await storeChat(chat);
    }

    return {
      chats: displayChats,
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw new Error("Failed to fetch chat history");
  }
}

// Get a specific chat and its messages
export async function getSpecificChat(chatId: string) {
  if (!chatId) throw new Error("Chat ID is required");

  try {
    // Try to get from Redis first
    const redisChat = await getChat(chatId);
    const redisMessages = await getChatMessages(chatId);

    if (redisChat) {
      return { ...redisChat, messages: redisMessages || [] };
    }

    // Fall back to database
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        module: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    if (!chat) throw new Error("Chat not found");

    // Cache in Redis for future requests
    await storeChat(chat);

    // Cache messages
    if (chat.messages && chat.messages.length > 0) {
      for (const message of chat.messages) {
        await storeMessage(chatId, message);
      }
    }

    return chat;
  } catch (error) {
    console.error(`Error fetching chat ${chatId}:`, error);
    throw new Error("Failed to fetch chat");
  }
}

// Delete a chat
export async function deleteChat(chatId: string) {
  if (!chatId) throw new Error("Chat ID is required");
  const { userId } = await getUserIdentifiers();

  try {
    // Delete from Redis first with proper error handling
    try {
      await redisDeleteChat(chatId, userId || undefined);
      console.log(`Chat ${chatId} deleted from Redis`);
    } catch (redisError) {
      console.error(`Error deleting chat ${chatId} from Redis:`, redisError);
      // Continue with database deletion even if Redis fails
    }

    // Then delete from database
    await prisma.message.deleteMany({
      where: { chatId },
    });

    await prisma.chat.delete({
      where: { id: chatId },
    });

    // Revalidate to update UI
    revalidatePath("/chat");

    return { success: true };
  } catch (error) {
    console.error(`Error deleting chat ${chatId}:`, error);
    throw new Error("Failed to delete chat");
  }
}

// Get module context for a chat
export async function getChatModuleContext(moduleId: string | null) {
  if (!moduleId) return null;

  try {
    const moduleContext = await getModuleContext(moduleId);
    return moduleContext;
  } catch (error) {
    console.error(`Error fetching module context for ${moduleId}:`, error);
    return null;
  }
}
