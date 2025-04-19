"use client";

import { useChat, UseChatOptions } from "ai/react";
import { useState } from "react";

export function useFileChat(options: UseChatOptions = {}) {
  const [files, setFiles] = useState<FileList | null>(null);

  const chatHelpers = useChat({
    ...options,
    body: files
      ? { ...options.body, experimental_attachments: files }
      : options.body,
  });

  // Function to submit the form with both text and files
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chatHelpers.handleSubmit(e, {
      experimental_attachments: files || undefined,
    });
    // Clear files after submission
    setFiles(null);
  };

  return {
    ...chatHelpers,
    files,
    setFiles,
    handleSubmit,
  };
}
