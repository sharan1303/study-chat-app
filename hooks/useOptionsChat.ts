"use client";

import { UseChatOptions } from "ai/react";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { ModelId, getDefaultModelId } from "@/lib/models";

// Extend the original ChatRequestOptions to include webSearch and model selection
interface ExtendedChatRequestOptions {
  experimental_attachments?: FileList;
  webSearch?: boolean;
  model?: ModelId;
}

export function useFileChat(options: UseChatOptions = {}) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    getDefaultModelId()
  );

  const chatHelpers = useChat({
    ...options,
    body: {
      ...options.body,
      ...(files ? { experimental_attachments: files } : {}),
      webSearch: webSearchEnabled,
      model: selectedModel,
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
    setSelectedModel,
    handleSubmit,
  };
}
