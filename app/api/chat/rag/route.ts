import { Message, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { formatChatTitle, generateId } from "@/lib/utils";
import {
  broadcastChatCreated,
  broadcastMessageCreated,
  broadcastUserMessageSent,
} from "@/lib/events";
import {
  createGeneralSystemPrompt,
  createModuleSystemPrompt,
} from "@/lib/prompts";
import {
  retrieveRelevantChunks,
  formatRetrievedContext,
} from "@/lib/retrieval";

/**
 * RAG-enhanced chat endpoint
 *
 * This endpoint enhances the chat experience by retrieving relevant chunks from the user's resources
 * and augmenting the prompt with this context before generating a response.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, chatId, moduleId } = body;
    const sessionId = body.sessionId || null;
    const optimisticChatId = body.optimisticChatId || null;

    const isModuleMode = !!moduleId;
    let chatTitle = body.title || "New Chat";
    const shouldSaveHistory = body.saveHistory !== false;
    const forceOldest = body.forceOldest === true;
    const currentUserObj = await currentUser();
    const userId = currentUserObj?.id || null;

    // Ensure we have a valid chatId - generate one if not provided
    const requestedChatId = chatId || generateId();

    // Both userId and sessionId can't be null if we want to save history
    if (shouldSaveHistory && !userId && !sessionId) {
      return Response.json(
        { error: "Session ID or authentication required to save chat history" },
        { status: 401 }
      );
    }

    // Immediately send a user.message.sent event to update the sidebar
    if (shouldSaveHistory && (userId || sessionId)) {
      try {
        // Get any module details if this is a module chat
        const moduleDetails = moduleId
          ? await prisma.module.findUnique({ where: { id: moduleId } })
          : null;

        // Get the last user message for the chat title
        const lastMessage = messages[messages.length - 1];
        const messageTitle = formatChatTitle(lastMessage.content);

        // Send an immediate event with the user's message
        const immediateMessageData = {
          id: generateId(),
          chatId: requestedChatId,
          chatTitle: messageTitle,
          updatedAt: new Date().toISOString(),
          moduleId: moduleId,
          optimisticChatId: optimisticChatId,
          module: moduleDetails,
        };

        const targetId = userId || sessionId;
        if (targetId) {
          console.log("Broadcasting user.message.sent event:", requestedChatId);
          broadcastUserMessageSent(immediateMessageData, [targetId]);
        }
      } catch (error) {
        console.error("Error broadcasting immediate user message:", error);
        // Continue processing even if this fails
      }
    }

    let user = null;

    // Only try to fetch user data if we should save history with a userId
    if (shouldSaveHistory && userId) {
      try {
        // Find the user by Clerk ID
        user = await prisma.user.findUnique({
          where: { id: userId },
        });

        // If user doesn't exist, create a new one using Clerk data
        if (!user && currentUserObj) {
          user = await prisma.user.create({
            data: {
              id: userId,
              email:
                currentUserObj.emailAddresses[0]?.emailAddress ||
                "user@example.com",
              name: currentUserObj.firstName
                ? `${currentUserObj.firstName} ${currentUserObj.lastName || ""}`
                : "Anonymous User",
            },
          });
        }

        if (!user) {
          console.error(`Failed to find or create user with ID: ${userId}`);
          return Response.json(
            { error: "User not found and could not be created" },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("Error finding/creating user:", error);
        return Response.json(
          { error: "Error processing user data" },
          { status: 500 }
        );
      }
    }

    // Get the last message from the user for RAG retrieval
    const lastUserMessage = messages[messages.length - 1].content;

    // Perform RAG retrieval to get relevant document chunks
    const retrievedChunks = await retrieveRelevantChunks(
      lastUserMessage,
      moduleId,
      3
    );
    const documentContext = formatRetrievedContext(retrievedChunks);

    // Create appropriate system prompt with context from documents
    let systemMessage = "";

    if (isModuleMode) {
      // Module-specific mode with RAG context
      const moduleContext = await prisma.module.findUnique({
        where: { id: moduleId },
        select: { context: true },
      });

      const moduleContextText = moduleContext?.context || "";
      systemMessage = createModuleSystemPrompt(
        moduleContextText,
        documentContext
      );
    } else {
      // General mode with RAG context
      systemMessage = createGeneralSystemPrompt(documentContext);
    }

    // Format messages for the model including the system message
    const formattedMessages: Message[] = [
      { id: "system", role: "system", content: systemMessage },
      ...messages,
    ];

    // Create chat title from first user message
    const firstUserMessage =
      messages.find((m: Message) => m.role === "user")?.content || "";
    chatTitle = formatChatTitle(firstUserMessage);

    try {
      // Use the streamText function from the AI SDK
      const result = streamText({
        model: google("gemini-2.0-flash"),
        messages: formattedMessages,
        temperature: 0.1,
        onFinish: async ({ text }) => {
          // Save chat history for authenticated users or anonymous users with sessionId
          if (shouldSaveHistory && (userId || sessionId)) {
            try {
              // Prepare data for creation
              const chatData: {
                id: string;
                title: string;
                moduleId: string | null;
                messages: { role: string; content: string }[];
                createdAt: Date;
                updatedAt: Date;
                userId?: string;
                sessionId?: string;
              } = {
                id: requestedChatId,
                title: chatTitle,
                moduleId: moduleId,
                messages: messages.concat([
                  { role: "assistant", content: text },
                ]),
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Add user ID or session ID based on authentication status
              if (userId) {
                chatData.userId = userId;
              } else if (sessionId) {
                chatData.sessionId = sessionId;
              }

              // If this chat should be forced to appear as the oldest, set an old timestamp
              if (forceOldest) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                chatData.createdAt = oneYearAgo;
                chatData.updatedAt = oneYearAgo;
              }

              const savedChat = await prisma.chat.upsert({
                where: { id: requestedChatId },
                update: {
                  messages: messages.concat([
                    { role: "assistant", content: text },
                  ]),
                  updatedAt: new Date(),
                },
                create: chatData,
              });

              // Broadcast the message.created event if enabled
              const validTargetId = userId || sessionId;
              if (validTargetId) {
                try {
                  // Get module details if needed
                  const moduleDetails = moduleId
                    ? await prisma.module.findUnique({
                        where: { id: moduleId },
                        select: { id: true, name: true, icon: true },
                      })
                    : null;

                  broadcastMessageCreated(
                    {
                      id: savedChat.id,
                      chatId: savedChat.id,
                      chatTitle,
                      updatedAt: savedChat.updatedAt.toISOString(),
                      module: moduleDetails,
                      moduleId: moduleId,
                      optimisticChatId: optimisticChatId,
                    },
                    [validTargetId]
                  );

                  // For new chats, also broadcast chat.created event
                  // if it's the first non-trivial chat message
                  if (chatId !== requestedChatId && text.length > 10) {
                    broadcastChatCreated(
                      {
                        id: savedChat.id,
                        title: chatTitle,
                        updatedAt: savedChat.updatedAt.toISOString(),
                        moduleId: moduleId,
                        module: moduleDetails,
                        optimisticChatId: optimisticChatId,
                      },
                      [validTargetId]
                    );
                  }
                } catch (eventError) {
                  console.error("Error broadcasting events:", eventError);
                  // Continue even if event broadcast fails
                }
              }
            } catch (saveError) {
              console.error("Error saving chat:", saveError);
              // We don't return an error since the streaming response has already begun
            }
          }
        },
      });

      return new Response(result, {
        headers: {
          "Content-Type": "text/plain",
          "X-Model": "gemini-2.0-flash",
        },
      });
    } catch (streamError) {
      console.error("Error in AI stream:", streamError);
      return Response.json(
        { error: "Error generating response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return Response.json(
      { error: "Error processing chat request" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
