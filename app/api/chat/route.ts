import { google } from "@ai-sdk/google";
import { Message as VercelChatMessage, streamText } from "ai";
import { searchWithPerplexity } from "@/lib/search";
import { getModuleContext } from "@/lib/modules";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, moduleId } = await req.json();

    // Check if we have a module ID (indicating module-specific mode)
    const isModuleMode = moduleId != null;

    // Get the last message from the user for potential search needs
    const lastUserMessage = messages[messages.length - 1].content;

    // Simple check if the message suggests a need for search
    const shouldSearch = needsSearch(lastUserMessage);

    let systemMessage = "";

    if (isModuleMode) {
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
${shouldSearch ? await searchWithPerplexity(lastUserMessage) : ""}

Always provide accurate, helpful information relative to the module context.
Explain concepts clearly and provide examples when appropriate.
Break down complex topics into understandable parts.
If you're not sure about something, acknowledge that and suggest what might be reasonable.`;
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
${shouldSearch ? await searchWithPerplexity(lastUserMessage) : ""}

Always provide accurate, helpful information.
Explain concepts clearly and provide examples when appropriate.
Break down complex topics into understandable parts.`;
    }

    // Format messages for the model including the system message
    const formattedMessages: VercelChatMessage[] = [
      { id: "system", role: "system", content: systemMessage },
      ...messages,
    ];

    // Use the streamText function from the AI SDK
    const result = await streamText({
      model: google("models/gemini-2.0-flash"),
      messages: formattedMessages,
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 2048,
    });

    // Convert the response to a streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
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
