"use client";

import { UseChatOptions } from "ai/react";
import { useChat } from "@ai-sdk/react";
import { useState, useRef } from "react";
import { ModelId, getDefaultModelId } from "@/lib/models";

// Extend the original ChatRequestOptions to include webSearch and model selection
interface ExtendedChatRequestOptions {
  experimental_attachments?: FileList;
  webSearch?: boolean;
  model?: ModelId;
  body?: Record<string, any>; // Add support for dynamic body parameters
}

export function useFileChat(options: UseChatOptions = {}) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    getDefaultModelId()
  );

  // Keep a ref to the latest body params so we can access them during submission
  const latestBodyParams = useRef<Record<string, any>>(options.body || {});

  // Update the ref whenever options.body changes
  if (options.body !== latestBodyParams.current) {
    latestBodyParams.current = options.body || {};
  }

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
  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    requestOptions?: ExtendedChatRequestOptions
  ) => {
    e.preventDefault();

    // Merge the latest body params with any dynamic ones provided in this call
    const mergedBody = {
      ...latestBodyParams.current,
      ...(requestOptions?.body || {}),
    };

    chatHelpers.handleSubmit(e, {
      experimental_attachments: files || undefined,
      webSearch: webSearchEnabled,
      model: selectedModel,
      body: mergedBody, // Pass merged body parameters
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
