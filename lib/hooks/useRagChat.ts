import { useChat as useAIChat } from "ai/react";
import { uuid } from "@ai-sdk/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseRagChatProps {
  initialMessages?: any[];
  chatId?: string;
  moduleId?: string;
  sessionId?: string;
  onError?: (error: Error) => void;
}

interface Source {
  resourceId: string;
  resourceTitle: string;
  snippet?: string;
}

export function useRagChat({
  initialMessages = [],
  chatId,
  moduleId,
  sessionId,
  onError,
}: UseRagChatProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const optimisticChatId = uuid();

  // Parse sources from a formatted response
  const parseSourcesFromResponse = useCallback((text: string) => {
    // Attempt to find a sources section using regex
    const sourcesMatch = text.match(/SOURCES:([\s\S]+)(?:$|(?=\n\n))/i);

    if (sourcesMatch && sourcesMatch[1]) {
      const sourcesText = sourcesMatch[1].trim();
      const extractedSources: Source[] = [];

      // Simple regex to find titles and IDs
      const sourceMatches = sourcesText.matchAll(
        /\[([^\]]+)\]\(resource:([a-f0-9-]+)\)/g
      );

      for (const match of sourceMatches) {
        if (match[1] && match[2]) {
          extractedSources.push({
            resourceTitle: match[1],
            resourceId: match[2],
          });
        }
      }

      if (extractedSources.length > 0) {
        setSources(extractedSources);
        return text.replace(sourcesMatch[0], ""); // Remove sources section from visible text
      }
    }

    return text;
  }, []);

  // Use AI SDK's useChat but with our RAG endpoint
  const chat = useAIChat({
    api: "/api/chat/rag",
    initialMessages,
    id: chatId,
    body: {
      chatId,
      moduleId,
      sessionId,
      optimisticChatId,
    },
    onResponse: (response) => {
      // Check for HTTP errors
      if (!response.ok) {
        toast.error("Failed to generate a response. Please try again.");
      }
    },
    onFinish: ({ content }) => {
      // Parse sources from the response
      parseSourcesFromResponse(content);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("An error occurred during chat. Please try again.");
      if (onError) onError(error);
    },
  });

  return {
    ...chat,
    sources,
    optimisticChatId,
  };
}
