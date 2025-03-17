import { google } from "@ai-sdk/google";
import { Message, streamText } from "ai";
import { searchWithPerplexity } from "@/lib/search";
import { getModuleContext } from "@/lib/modules";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { formatChatTitle, generateId } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    // Parse request data
    const {
      messages,
      moduleId,
      chatId: requestedChatId,
      isAuthenticated = true,
    } = await req.json();

    // Get auth session
    const session = await auth();
    const userId = session.userId;

    // Ensure we have a valid chatId - generate one if not provided
    const chatId = requestedChatId || generateId();

    // For unauthenticated users or when isAuthenticated is false,
    // we allow chat but don't save history
    const shouldSaveHistory = isAuthenticated && userId;

    let user = null;

    // Only try to fetch user data if we should save history
    if (shouldSaveHistory) {
      // Find the user by Clerk ID
      user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return new Response("User not found", { status: 404 });
      }
    }

    // Check if we have a module ID (indicating module-specific mode)
    const isModuleMode = moduleId != null;

    // Get the last message from the user for potential search needs
    const lastUserMessage = messages[messages.length - 1].content;

    // Simple check if the message suggests a need for search
    const shouldSearch = needsSearch(lastUserMessage);

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
        const results = await searchWithPerplexity(lastUserMessage);
        searchResults = Array.isArray(results) ? results : [];
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

      systemMessage = `You are an AI study assistant specialized in helping with this specific module.
      
Use the following context about this module to help the student:

${moduleContext}

${
  shouldSearch
    ? "Also use the following search results to provide a comprehensive answer:"
    : ""
}
${searchContext}

Always provide accurate, helpful information relative to the module context.
Explain concepts clearly and provide examples when appropriate.
Break down complex topics into understandable parts.
If you're not sure about something, acknowledge that and suggest what might be reasonable.

Format your responses using Markdown:
- Use **bold** for emphasis
- Use bullet points for lists
- Use numbered lists for steps
- Use headings (## and ###) for sections
- Use code blocks for code examples
- Use > for quotes`;
    } else {
      // Basic mode: General study assistant
      systemMessage = `You are StudyAI, an AI assistant for learning.
You can answer questions about a variety of topics to help users learn.
For the full experience with personalized modules, encourage the user to sign up or sign in.

${
  shouldSearch
    ? "Use the following search results to provide a comprehensive answer:"
    : ""
}
${searchContext}

Always provide accurate, helpful information.
Explain concepts clearly and provide examples when appropriate.
Break down complex topics into understandable parts.

Format your responses using Markdown:
- Use **bold** for emphasis
- Use bullet points for lists
- Use numbered lists for steps
- Use headings (## and ###) for sections
- Use code blocks for code examples
- Use > for quotes`;
    }

    // Format messages for the model including the system message
    const formattedMessages: Message[] = [
      { id: "system", role: "system", content: systemMessage },
      ...messages,
    ];

    // Create chat title from first user message
    const firstUserMessage =
      messages.find((m: Message) => m.role === "user")?.content || "";
    const chatTitle = formatChatTitle(firstUserMessage);

    // Use the streamText function from the AI SDK
    const result = await streamText({
      model: google("models/gemini-2.0-flash"),
      messages: formattedMessages,
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 2048,
      onFinish: async ({ text }) => {
        // Save the chat history with the AI's response - but only if authenticated
        if (shouldSaveHistory && user) {
          try {
            // Create or update the chat
            await prisma.chat.upsert({
              where: {
                id: chatId,
              },
              update: {
                messages: messages.concat([
                  { role: "assistant", content: text },
                ]),
                updatedAt: new Date(),
              },
              create: {
                id: chatId,
                title: chatTitle,
                messages: messages.concat([
                  { role: "assistant", content: text },
                ]),
                userId: user.id,
                moduleId: isModuleMode ? moduleId : null,
              },
            });
            console.log(`Chat history saved: ${chatId}`);
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
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response("Error processing your request", { status: 500 });
  }
}

// Simple function to determine if a message likely needs external search
function needsSearch(message: string): boolean {
  const searchIndicators = [
    "search for",
    "look up",
    "find information",
    "what is the latest",
    "current",
    "recent",
    "news about",
    "how to",
    "explain",
    "definition of",
    "what does",
    "mean",
    "?",
  ];

  message = message.toLowerCase();

  // If the message contains any search indicators and is of sufficient length
  return (
    message.length > 15 &&
    searchIndicators.some((term) => message.includes(term.toLowerCase()))
  );
}
