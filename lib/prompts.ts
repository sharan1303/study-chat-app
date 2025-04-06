/**
 * This file contains all the prompts used in the Study Chat application.
 * Centralizing prompts makes it easier to maintain, update, and reuse them.
 */

/**
 * The welcome message shown to users when they first visit the app.
 * This introduces Study Chat and its features.
 */
export const WELCOME_PROMPT = {
  id: "user-intro",
  role: "user" as const,
  content: "What is Study Chat and how can it help me?",
};

/**
 * The response to the welcome message, describing what Study Chat is and its features.
 */
export const WELCOME_RESPONSE = {
  id: "welcome",
  role: "assistant" as const,
  content:
    "# Study Chat is your personal AI Chat for studying." +
    "\n## How Study Chat can help you?" +
    "\n### 1. We are modular." +
    "\nCreate specialised AI agents for different subjects\n\n" +
    "\n### 2. We bring your notes to life." +
    "\nAsk questions about documents you've uploaded\n\n" +
    "\n### 3. We bring the internet to you." +
    "\nSearch the internet and filter sources specifically for academic papers\n\n" +
    "\n### 4. You can configure us." +
    "\nCategorise conversations into modules to match your structure\n" +
    "\nWhat would you like to study today? You can start by creating a module, or just ask me a question about any subject you're studying!",
};

/**
 * The welcome message for a specific module chat.
 *
 * @param moduleName - The name of the module
 * @returns A message object with the welcome content
 */
export const createModuleWelcomeMessage = (moduleName: string | null) => ({
  id: "welcome",
  role: "assistant" as const,
  content: moduleName
    ? `👋 Welcome to the "${moduleName}" module! I'm ready to help you learn about this topic\n\nWhat would you like to know?`
    : "👋 Welcome to Study Chat! I'm here to help you learn.\n\n" +
      "What would you like to study today?",
});

/**
 * System prompt for the general chat assistant.
 * This is used when the user is chatting outside of any specific module.
 *
 * @param searchContext - Optional search results to include in the prompt
 * @returns The system prompt string
 */
export const createGeneralSystemPrompt = (searchContext = "") => `
  You are Study Chat, an AI assistant for learning.
  You can answer questions about a variety of topics to help users learn.
  For the full experience with personalized modules, encourage the user to sign up or sign in.

  ${
    searchContext
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
  - Use > for quotes
`;

/**
 * System prompt for the module-specific chat assistant.
 * This is used when the user is chatting within a specific module.
 *
 * @param moduleContext - Information about the module and its resources
 * @param searchContext - Optional search results to include in the prompt
 * @returns The system prompt string
 */
export const createModuleSystemPrompt = (
  moduleContext: string,
  searchContext = ""
) => `
  You are an AI study assistant specialized in helping with this specific module.
    
  Use the following context about this module to help the student:

  ${moduleContext}

  ${
    searchContext
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
  - Use > for quotes
`;

/**
 * List of search indicator phrases used to determine if a message needs external search.
 */
export const SEARCH_INDICATORS = [
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
