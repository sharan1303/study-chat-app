"use client";

import { UseChatOptions } from "ai/react";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { ModelId, getDefaultModelId, SUPPORTED_MODELS } from "@/lib/models";

// Extend the original ChatRequestOptions to include webSearch and model selection
interface ExtendedChatRequestOptions {
  experimental_attachments?: FileList;
  webSearch?: boolean;
  model?: ModelId;
}

// Create a chat state storage key based on chat ID
const getModelStorageKey = (chatId: string) => `chat_model_${chatId}`;

export function useFileChat(options: UseChatOptions = {}) {
  const chatId = options.body?.chatId as string;

  // Initialize with stored model if available, otherwise use default
  const getInitialModel = (): ModelId => {
    if (typeof window !== "undefined" && chatId) {
      const storedModel = localStorage.getItem(getModelStorageKey(chatId));
      // Check if stored model is a valid ModelId
      if (storedModel && storedModel in SUPPORTED_MODELS) {
        return storedModel as ModelId;
      }
    }
    return getDefaultModelId();
  };

  const [files, setFiles] = useState<FileList | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    getInitialModel()
  );

  // Save model selection whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && chatId && selectedModel) {
      localStorage.setItem(getModelStorageKey(chatId), selectedModel);
    }
  }, [selectedModel, chatId]);

  // Wrapper for setSelectedModel that also updates localStorage
  const updateSelectedModel = (newModel: ModelId) => {
    console.log(`Changing model to: ${newModel}`);
    setSelectedModel(newModel);
    if (typeof window !== "undefined" && chatId) {
      localStorage.setItem(getModelStorageKey(chatId), newModel);
    }
  };

  // Always log the current model when initializing or changing
  useEffect(() => {
    console.log(`Current model for chat ${chatId}: ${selectedModel}`);
  }, [selectedModel, chatId]);

  const chatHelpers = useChat({
    ...options,
    body: {
      ...options.body,
      ...(files ? { experimental_attachments: files } : {}),
      webSearch: webSearchEnabled,
      model: selectedModel,
    },
    // Ensure model selection persists even if API resets it
    onFinish: (message) => {
      // Run the original onFinish if it exists
      if (options.onFinish) {
        options.onFinish(message);
      }

      // Ensure we keep the model selection by updating localStorage again
      if (typeof window !== "undefined" && chatId && selectedModel) {
        localStorage.setItem(getModelStorageKey(chatId), selectedModel);
      }
    },
  });

  // Function to submit the form with both text and files
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chatHelpers.handleSubmit(e, {
      experimental_attachments: files || undefined,
      webSearch: webSearchEnabled,
      model: selectedModel,
    } as ExtendedChatRequestOptions);
    // Clear files after submission
    setFiles(null);
  };

  return {
    ...chatHelpers,
    files,
    setFiles,
    webSearchEnabled,
    setWebSearchEnabled,
    selectedModel,
    setSelectedModel: updateSelectedModel,
    handleSubmit,
  };
}
