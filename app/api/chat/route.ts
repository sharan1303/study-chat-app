import { LangChainAdapter } from "ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { PerplexityAPI } from "@/lib/perplexity";
import { getModuleContext } from "@/lib/modules";
import { RunnableSequence, RunnableBranch } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Define types for messages
type Message = { role: string; content: string };
type MessageHistory = Array<[string, string]>;

// Remove edge runtime directive to use Node.js runtime instead
// export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, moduleId } = await req.json();
  const isAuthenticated = moduleId != null;

  // Get the module-specific context only if authenticated with a moduleId
  const moduleContext = isAuthenticated ? await getModuleContext(moduleId) : "";

  // Create the LLM
  const llm = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2,
    streaming: true,
  });

  // Create the Perplexity API client for search capabilities
  const perplexity = new PerplexityAPI();
  const searchTool = perplexity.searchTool;

  // Choose the appropriate system message based on authentication state
  const systemMessage = isAuthenticated
    ? `You are an AI study assistant specialized in ${moduleId}.
    Use the following context about this module to help the student:

    ${moduleContext}

    Always provide accurate, helpful information. If you don't know something, say "I need to search for that information."
    Explain concepts clearly and provide examples when appropriate.`
        : `You are StudyAI, an AI assistant for learning.
    You can answer questions about a variety of topics to help users learn.
    For the full experience with personalized modules, encourage the user to sign up or sign in.
    Always provide accurate, helpful information. If you don't know something, say so.
    Explain concepts clearly and provide examples when appropriate.`;

  // Create a prompt template for direct answers
  const directPrompt = ChatPromptTemplate.fromMessages([
    ["system", systemMessage],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  // Create a prompt to determine if search is needed
  const shouldSearchPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an AI assistant that determines if a search is needed to answer a question.
Respond with "SEARCH" if you need to search for information to answer accurately.
Respond with "NO_SEARCH" if you can answer the question with your existing knowledge.
Only respond with one of these two options.`,
    ],
    ["human", "{input}"],
  ]);

  // Create a prompt for search-based answers with the appropriate system message
  const searchPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      isAuthenticated
        ? `You are an AI study assistant specialized in ${moduleId}.
Use the following context about this module to help the student:

${moduleContext}

Also use the following search results to provide a comprehensive answer:

{search_results}

Explain concepts clearly and provide examples when appropriate.`
        : `You are StudyAI, an AI assistant for learning.
Use the following search results to provide a comprehensive answer:

{search_results}

For the full experience with personalized modules, encourage the user to sign up or sign in.
Explain concepts clearly and provide examples when appropriate.`,
    ],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  // Create a chain to determine if search is needed
  const shouldSearchChain = RunnableSequence.from([
    shouldSearchPrompt,
    llm,
    new StringOutputParser(),
  ]);

  // Create a chain for direct answers
  const directAnswerChain = RunnableSequence.from([
    directPrompt,
    llm,
    new StringOutputParser(),
  ]);

  // Create a chain for search-based answers
  const searchAnswerChain = RunnableSequence.from([
    async (input: { input: string; history: MessageHistory }) => {
      // Perform the search
      const searchResults = await searchTool.invoke(input.input);

      // Return the input with search results
      return {
        input: input.input,
        history: input.history,
        search_results: searchResults,
      };
    },
    searchPrompt,
    llm,
    new StringOutputParser(),
  ]);

  // Create a branch to decide whether to search or answer directly
  const chain = RunnableBranch.from([
    [
      async (input: { input: string; history: MessageHistory }) => {
        const result = await shouldSearchChain.invoke({ input: input.input });
        return result.trim() === "SEARCH";
      },
      searchAnswerChain,
    ],
    directAnswerChain,
  ]);

  // Get the last message from the user
  const lastMessage = messages[messages.length - 1].content;

  // Format previous messages for chat history
  const history = messages.slice(0, -1).map((msg: Message) => {
    return msg.role === "user" ? ["human", msg.content] : ["ai", msg.content];
  });

  // Stream the response
  const stream = await chain.stream({
    input: lastMessage,
    history,
  });

  // Use LangChainAdapter to convert the stream to a Response
  return LangChainAdapter.toDataStreamResponse(stream);
}
