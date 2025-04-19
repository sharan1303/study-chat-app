import { Message, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { searchWithPerplexity } from "@/lib/search";

import { getModuleContext } from "@/lib/modules";

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
  SEARCH_INDICATORS,
} from "@/lib/prompts";

// Define types for message content structures
interface ContentPart {
  type: string;
  [key: string]: any;
}

interface TextPart extends ContentPart {
  type: "text";
  text: string;
}

interface FilePart extends ContentPart {
  type: "file";
  data: string;
  mimeType: string;
}

// Type for content array
type ContentArray = (TextPart | FilePart)[];

/**
 * Handles an HTTP POST request for chat interactions.
 *
 * This asynchronous function processes a chat request by extracting user messages, performing an optional search on the last user message,
 * and constructing a system prompt tailored for either a module-specific or a general study assistant context. It streams an AI-generated response
 * and, if enabled, saves the chat history by updating the database and broadcasting relevant events.
 *
 * The request body must be valid JSON, including keys such as messages, chatId, moduleId, sessionId, title, and an optional saveHistory flag.
 * On success, it returns a streaming Response with a header indicating the AI model used. Errors in any step result in an appropriate JSON error
 * response with corresponding HTTP status codes.
 *
 * @param request - The incoming HTTP request containing chat interaction data.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, chatId, moduleId } = body;
    const sessionId = body.sessionId || null;
    // We keep this parameter but don't use it anymore since we always want to broadcast AI responses
    // const skipMessageBroadcast = body.skipMessageBroadcast || false;
    const optimisticChatId = body.optimisticChatId || null;
    // Extract experimental_attachments if available
    const attachments = body.experimental_attachments || null;

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
        const moduleDetails = moduleId ? await getModuleMeta(moduleId) : null;

        // Get the last user message for the chat title
        const lastMessage = messages[messages.length - 1];
        const messageTitle = formatChatTitle(
          typeof lastMessage.content === "string"
            ? lastMessage.content
            : lastMessage.content[0]?.text || "New Chat"
        );

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

    // Process messages for content extraction and format adjustment
    const processedMessages = messages.map((message: Message) => {
      // For all messages, just return as is - we'll handle content type differences when needed
      return message;
    });

    // Handle attachments in the last user message if it exists
    if (attachments && processedMessages.length > 0) {
      const lastMessageIndex = processedMessages.length - 1;
      const lastMessage = processedMessages[lastMessageIndex];

      // Only process if it's a user message
      if (lastMessage.role === "user") {
        const content =
          typeof lastMessage.content === "string"
            ? [{ type: "text", text: lastMessage.content }]
            : lastMessage.content;

        // Add file attachments to the content array
        const updatedContent = [...content];

        // Process each attachment
        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];
          const arrayBuffer = await file.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString("base64");

          updatedContent.push({
            type: "file",
            data: base64Data,
            mimeType: file.type,
          });
        }

        processedMessages[lastMessageIndex].content = updatedContent;
      }
    }

    // Get the last message from the user for potential search needs
    const lastUserMessage = processedMessages[processedMessages.length - 1];
    let lastUserContent = "";

    if (typeof lastUserMessage.content === "string") {
      lastUserContent = lastUserMessage.content;
    } else if (Array.isArray(lastUserMessage.content)) {
      const contentArray = lastUserMessage.content as ContentArray;
      const textPart = contentArray.find((c) => c.type === "text") as
        | TextPart
        | undefined;
      lastUserContent = textPart?.text || "";
    }

    // Simple check if the message suggests a need for search
    const shouldSearch = needsSearch(lastUserContent);

    let systemMessage = "";

    // Define a type for search results
    interface SearchResult {
      title: string;
      content: string;
    }

    let searchResults: SearchResult[] = [];
    if (shouldSearch) {
      try {
        // Perform search with Perplexity API
        const resultsText = await searchWithPerplexity(lastUserContent);
        // Create a single search result with the entire text response
        searchResults = [
          {
            title: "Search Results",
            content: resultsText,
          },
        ];
      } catch (searchError) {
        console.error("Error performing search:", searchError);
      }
    }

    // Format search results for inclusion in the prompt if available
    const searchContext =
      searchResults.length > 0
        ? searchResults
            .map((result) => `[${result.title}]: ${result.content}`)
            .join("\n\n")
        : "";

    if (isModuleMode && shouldSaveHistory) {
      // Module-specific mode: Get module context and build specialized prompt
      const moduleContext = await getModuleContext(moduleId);
      systemMessage = createModuleSystemPrompt(moduleContext, searchContext);
    } else {
      // Basic mode: General study assistant
      systemMessage = createGeneralSystemPrompt(searchContext);
    }

    // Format messages for the model including the system message
    const formattedMessages: Message[] = [
      { id: "system", role: "system", content: systemMessage },
      ...processedMessages,
    ];

    // Create chat title from first user message
    const firstUserMessage = processedMessages.find(
      (m: Message) => m.role === "user"
    );
    let titleText = "New Chat";

    if (firstUserMessage) {
      if (typeof firstUserMessage.content === "string") {
        titleText = firstUserMessage.content;
      } else if (Array.isArray(firstUserMessage.content)) {
        const contentArray = firstUserMessage.content as ContentArray;
        const textPart = contentArray.find((c) => c.type === "text") as
          | TextPart
          | undefined;
        titleText = textPart?.text || titleText;
      }
    }

    chatTitle = formatChatTitle(titleText);

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
              // For saving to database, simplify messages to string content
              const simplifiedMessages = processedMessages.map(
                (message: Message) => {
                  if (typeof message.content === "string") {
                    return { role: message.role, content: message.content };
                  }

                  // For multi-part content, extract text and create a simple note about attachments
                  let textContent = "";
                  let hasAttachments = false;

                  if (Array.isArray(message.content)) {
                    // Safe to use as ContentArray since we validate the array
                    const contentArray = message.content as ContentArray;
                    const textPart = contentArray.find(
                      (c) => c.type === "text"
                    ) as TextPart | undefined;
                    textContent = textPart?.text || "";
                    hasAttachments = contentArray.some(
                      (c) => c.type === "file"
                    );
                  }

                  return {
                    role: message.role,
                    content: hasAttachments
                      ? `${textContent}\n[This message included file attachments]`
                      : textContent,
                  };
                }
              );

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
                messages: simplifiedMessages.concat([
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
                  messages: simplifiedMessages.concat([
                    { role: "assistant", content: text },
                  ]),
                  updatedAt: new Date(),
                },
                create: chatData,
              });

              // Determine if this was a new chat by comparing timestamps
              // If timestamps are equal (accounting for millisecond precision differences),
              // or this was forced as oldest, then it's a new chat
              const isNewChat =
                forceOldest ||
                Math.abs(
                  savedChat.createdAt.getTime() - savedChat.updatedAt.getTime()
                ) < 1000;

              // Only broadcast for new chats
              if (isNewChat) {
                // Create single chat creation event
                const chatEventData: {
                  id: string;
                  title: string;
                  moduleId: string | null;
                  createdAt: Date;
                  updatedAt: Date;
                  sessionId: string | null;
                  optimisticChatId?: string;
                  module: { id: string; name: string; icon: string } | null;
                } = {
                  id: savedChat.id,
                  title: savedChat.title,
                  moduleId: savedChat.moduleId,
                  createdAt: savedChat.createdAt,
                  updatedAt: savedChat.updatedAt,
                  sessionId: sessionId,
                  // Include optimisticChatId if it was provided, to help client replace the optimistic chat
                  optimisticChatId: optimisticChatId,
                  // Include module info if available
                  module: null, // Will be populated below
                };

                // Get module info if this is a module chat
                if (savedChat.moduleId) {
                  try {
                    const moduleData = await getModuleMeta(savedChat.moduleId);

                    if (moduleData) {
                      chatEventData.module = moduleData;
                      console.log(
                        "Retrieved module info for chat.created event"
                      );
                    }
                  } catch (err) {
                    console.error(
                      "Error fetching module details for chat.created event:",
                      err
                    );
                  }
                }

                // Determine target ID for broadcast
                const targetId = userId || sessionId;

                if (targetId) {
                  console.log(
                    "Broadcasting chat.created event for new chat:",
                    savedChat.id,
                    "with module info:",
                    chatEventData.module
                  );
                  console.log("Target ID for broadcast:", targetId);
                  broadcastChatCreated(chatEventData, [targetId]);
                } else {
                  console.warn(
                    "No target ID found for broadcasting chat.created event"
                  );
                }
              } else {
                console.log(
                  "Chat already exists, not sending chat.created event"
                );

                // TEMPORARY FIX: Also send chat.created for existing chats to help debug
                const chatEventData: {
                  id: string;
                  title: string;
                  moduleId: string | null;
                  createdAt: Date;
                  updatedAt: Date;
                  sessionId: string | null;
                  optimisticChatId?: string;
                  module: { id: string; name: string; icon: string } | null;
                } = {
                  id: savedChat.id,
                  title: savedChat.title,
                  moduleId: savedChat.moduleId,
                  createdAt: savedChat.createdAt,
                  updatedAt: savedChat.updatedAt,
                  sessionId: sessionId,
                  optimisticChatId: optimisticChatId,
                  module: null, // Will be populated below
                };

                // Get module info if this is a module chat
                if (savedChat.moduleId) {
                  try {
                    const moduleData = await getModuleMeta(savedChat.moduleId);

                    if (moduleData) {
                      chatEventData.module = moduleData;
                      console.log("Retrieved module info for existing chat");
                    }
                  } catch (err) {
                    console.error(
                      "Error fetching module details for existing chat:",
                      err
                    );
                  }
                }

                const targetId = userId || sessionId;
                if (targetId) {
                  console.log(
                    "TEMPORARY DEBUG: Broadcasting chat.created for existing chat:",
                    savedChat.id,
                    "with module info:",
                    chatEventData.module
                  );
                  broadcastChatCreated(chatEventData, [targetId]);
                }

                // For existing chats, always broadcast message created event
                try {
                  // Get any module details if this is a module chat
                  let moduleDetails = null;
                  if (savedChat.moduleId) {
                    try {
                      moduleDetails = await getModuleMeta(savedChat.moduleId);
                    } catch (err) {
                      console.error(
                        "Error fetching module details for event:",
                        err
                      );
                    }
                  }

                  const messageData = {
                    id: generateId(),
                    chatId: savedChat.id,
                    chatTitle: savedChat.title,
                    updatedAt: savedChat.updatedAt.toISOString(),
                    moduleId: savedChat.moduleId,
                    // Include optimistic chat ID if it was provided
                    optimisticChatId: optimisticChatId,
                    // Include module info if available for better client-side handling
                    module: moduleDetails,
                  };

                  const targetId = userId || sessionId;

                  if (targetId) {
                    broadcastMessageCreated(messageData, [targetId]);
                  }
                } catch (error) {
                  console.error("Error broadcasting message creation:", error);
                }
              }
            } catch (error) {
              console.error("Error saving chat history:", error);
            }
          }
        },
      });

      // Get a data stream response and add model information in the header
      const response = result.toDataStreamResponse();
      const headers = new Headers(response.headers);
      headers.set("x-model-used", "Gemini 2.0 Flash");

      // Return a new response with our custom headers
      return new Response(response.body, {
        headers: headers,
        status: 200,
      });
    } catch (aiError) {
      console.error("Error with AI model:", aiError);

      // Fallback to a basic error message
      return Response.json(
        {
          error:
            "Unable to generate a response. The AI service may be temporarily unavailable.",
          details: aiError instanceof Error ? aiError.message : String(aiError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in chat route:", error);
    return Response.json(
      {
        error: "Error processing your request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Simple function to determine if a message likely needs external search
function needsSearch(message: string): boolean {
  message = message.toLowerCase();

  // If the message contains any search indicators and is of sufficient length
  return (
    message.length > 15 &&
    SEARCH_INDICATORS.some((term) => message.includes(term.toLowerCase()))
  );
}

async function getModuleMeta(moduleId: string) {
  try {
    return await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, name: true, icon: true },
    });
  } catch (err) {
    console.error("Error fetching module details:", err);
    return null;
  }
}
