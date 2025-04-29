"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";
import { Check, Copy } from "lucide-react";
import type { Message } from "@ai-sdk/react";
import { getOSModifierKey, extractSourcesFromContent } from "@/lib/utils";
import { toast } from "sonner";
import FileAttachment from "@/components/Chat/FileAttachment";
import SourcesDialog, {
  Source,
  FileAttachment as FileAttachmentType,
} from "@/components/Chat/SourcesDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TypingIndicator from "./TypingIndicator";

// Define content types
interface TextContent {
  type: "text";
  text: string;
}

interface FileContent {
  type: "file";
  data: string;
  mimeType: string;
  name?: string;
}

type MessageContent = TextContent | FileContent;

export interface ChatMessagesProps {
  messages: Message[];
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  modelName: string;
  isLoading?: boolean;
  copyToClipboard?: (text: string, messageId: string) => void;
  copiedMessageId?: string | null;
  stop?: () => void;
}

// Helper function to extract text from message content for clipboard
const getClipboardText = (content: string | MessageContent[]) => {
  return typeof content === "string"
    ? content
    : content
        .filter((p): p is TextContent => p.type === "text")
        .map((p) => p.text)
        .join("\n") || "[non‑text content]";
};

// Shared component to render message content based on its type
const renderMessageContent = (
  content: string | MessageContent[],
  messageId: string,
  isAssistant: boolean,
  message?: Message
) => {
  // Collect file attachments for the SourcesDialog
  const files: FileAttachmentType[] = [];

  // Try to extract file attachments from message metadata if available
  if (message && (message as any).metadata?.files) {
    const metadataFiles = (message as any).metadata.files as any[];
    metadataFiles.forEach((file) => {
      if (file.name && file.type) {
        files.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url,
        });
      }
    });
  }

  // If this is an assistant message, look for file attachments in content array
  if (Array.isArray(content)) {
    content.forEach((part) => {
      if (part.type === "file") {
        const fileContent = part as FileContent;
        const fileExists = files.some(
          (f) => f.name === fileContent.name && f.type === fileContent.mimeType
        );

        if (!fileExists) {
          files.push({
            name: fileContent.name || `File${files.length + 1}`,
            type: fileContent.mimeType,
            url: `data:${fileContent.mimeType};base64,${fileContent.data}`,
            size: fileContent.data
              ? Math.ceil(fileContent.data.length * 0.75)
              : undefined,
          });
        }
      }
    });
  }

  if (typeof content === "string") {
    if (isAssistant) {
      // Format assistant message with markdown and handle sources
      return formatAssistantContent(content, files);
    }
    // Simple text rendering for user messages
    return <div>{content}</div>;
  }

  if (Array.isArray(content)) {
    const textContent = content.filter((part) => part.type === "text");

    return (
      <div className="w-full">
        {/* Render text parts with files */}
        {textContent.map((part, i) => {
          if (part.type === "text") {
            return isAssistant ? (
              <div key={i}>{formatAssistantContent(part.text, files)}</div>
            ) : (
              <div key={i}>{part.text}</div>
            );
          }
          return null;
        })}

        {/* Render file parts with FileAttachment component */}
        {content.map((part, i) => {
          if (part.type === "file") {
            return (
              <FileAttachment
                key={i}
                file={part as FileContent}
                index={i}
                messageId={messageId}
              />
            );
          }
          return null;
        })}
      </div>
    );
  }

  return <div>Unsupported content format</div>;
};

// Function to format assistant message content with markdown and handle sources
const formatAssistantContent = (
  content: string,
  files?: FileAttachmentType[]
) => {
  // Extract sources for the dialog
  const sources = extractSourcesFromContent(content);

  // Always show the sources dialog if we have sources or files
  const hasSources = sources.length > 0;
  const hasFiles = files && files.length > 0;
  const shouldShowSourcesDialog = hasSources || hasFiles;

  // Debug logging
  console.log("formatAssistantContent:", {
    hasSources,
    hasFiles,
    shouldShowSourcesDialog,
    sourceCount: sources.length,
    fileCount: files?.length || 0,
    files: files,
  });

  // Check if the message has a sources section to split the content
  const sourcesSectionRegex = /---\s*\n\s*\*\*Sources:\*\*/;
  const hasSourcesSection = sourcesSectionRegex.test(content);

  // If we have a sources section, only show the main content
  const mainContent = hasSourcesSection
    ? content.split(/---\s*\n/)[0]
    : content;

  return (
    <>
      {shouldShowSourcesDialog && (
        <SourcesDialog sources={sources} files={files || []} />
      )}
      <ReactMarkdown
        components={{
          code(props: any) {
            const { inline, className, children, ...rest } = props;
            return (
              <CodeBlock
                key={`code-${inline ? "inline" : "block"}-${Math.random()}`}
                inline={inline}
                className={className}
                {...rest}
              >
                {children}
              </CodeBlock>
            );
          },
        }}
      >
        {mainContent}
      </ReactMarkdown>
    </>
  );
};

const UserMessage: React.FC<{
  message: Message;
  copyToClipboard: (text: string) => void;
  isCopied: boolean;
}> = ({ message, copyToClipboard, isCopied }) => {
  const messageRef = useRef<HTMLDivElement>(null);

  // Add keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Cmd/Ctrl+C is pressed while the message is being hovered
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        if (messageRef.current?.matches(":hover")) {
          e.preventDefault();
          copyToClipboard(getClipboardText(message.content));
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [message.content, copyToClipboard]);

  return (
    <div
      ref={messageRef}
      key={`user-${message.id}`}
      className="flex flex-col items-end group relative user-message"
      data-message-id={message.id}
    >
      <div className="rounded-xl p-4 bg-card text-card-foreground break-words">
        {renderMessageContent(message.content, message.id, false, message)}
      </div>
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    copyToClipboard(getClipboardText(message.content));
                  }
                }}
                type="button"
                onClick={() =>
                  copyToClipboard(getClipboardText(message.content))
                }
                className="flex items-center p-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                aria-label="Copy message"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 hover:cursor-pointer" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Copy message ({getOSModifierKey()}+C)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

const AssistantMessage: React.FC<{
  message: Message;
  modelName: string;
  copyToClipboard: (text: string) => void;
  isCopied: boolean;
}> = ({ message, modelName, copyToClipboard, isCopied }) => {
  const messageRef = useRef<HTMLDivElement>(null);

  // Debug message metadata
  React.useEffect(() => {
    console.log("AssistantMessage metadata:", {
      messageId: message.id,
      hasMetadata: !!(message as any).metadata,
      metadata: (message as any).metadata,
      contentType: typeof message.content,
      isArray: Array.isArray(message.content),
    });
  }, [message]);

  // Add keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Cmd/Ctrl+C is pressed while the message is being hovered
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        if (messageRef.current?.matches(":hover")) {
          e.preventDefault();
          copyToClipboard(getClipboardText(message.content));
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [message.content, copyToClipboard]);

  return (
    <div
      ref={messageRef}
      key={`assistant-${message.id}`}
      className="text-gray-800 dark:text-gray-200 group relative assistant-message"
      data-message-id={message.id}
    >
      <div className="prose prose-xs dark:prose-invert max-w-none w-full break-words prose-spacing text-sm">
        {renderMessageContent(message.content, message.id, true, message)}
      </div>
      <div className="mb-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    copyToClipboard(getClipboardText(message.content));
                  }
                }}
                type="button"
                onClick={() =>
                  copyToClipboard(getClipboardText(message.content))
                }
                className="flex items-center p-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
                aria-label="Copy message"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Copy message ({getOSModifierKey()}+C)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="text-xs text-muted-foreground">
          Generated with {modelName}
        </div>
      </div>
    </div>
  );
};

export default function ChatMessages({
  messages,
  scrollContainerRef,
  modelName,
  isLoading,
  copyToClipboard,
  copiedMessageId,
  stop,
}: ChatMessagesProps) {
  // Local state for copied message if not provided
  const [localCopiedMessageId, setLocalCopiedMessageId] = useState<
    string | null
  >(null);

  // Keep track of the last messages count to know when a new message is added
  const lastMessagesCountRef = useRef<number>(messages.length);
  // Reference to the latest user message element
  const latestUserMessageRef = useRef<HTMLDivElement>(null);

  // Scroll to the most recent user message when it's added
  React.useEffect(() => {
    if (messages.length > lastMessagesCountRef.current) {
      // Check if the newest message is from the user
      const newestMessage = messages[messages.length - 1];
      if (newestMessage.role === "user" && latestUserMessageRef.current) {
        // Small timeout to ensure DOM is fully updated
        setTimeout(() => {
          if (scrollContainerRef?.current) {
            // Calculate the position to scroll to (adjust for header height)
            // Adding more space (120px instead of 80px) from the top of the viewport
            const scrollTop = latestUserMessageRef.current
              ? latestUserMessageRef.current.offsetTop - 120
              : 0;
            scrollContainerRef.current.scrollTo({
              top: scrollTop,
              behavior: "smooth",
            });
          } else {
            // Fallback to scrolling the element into view
            latestUserMessageRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 100);
      }
      // Update the messages count reference
      lastMessagesCountRef.current = messages.length;
    }
  }, [messages, scrollContainerRef]);

  const handleCopyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setLocalCopiedMessageId(messageId);
        toast.success("Copied to clipboard");
        setTimeout(() => setLocalCopiedMessageId(null), 2000);
      })
      .catch(() => toast.error("Failed to copy"));
  };

  // Get the index of the latest user message
  const latestUserMessageIndex = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return i;
      }
    }
    return -1;
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto pt-14">
      <div className="max-w-3xl mx-auto pl-6 pr-4 pb-20">
        {messages.map((message, index) => {
          // Determine if this is the latest user message
          const isLatestUserMessage = index === latestUserMessageIndex;

          return (
            <React.Fragment key={message.id || index}>
              {message.role === "user" ? (
                <div
                  ref={isLatestUserMessage ? latestUserMessageRef : null}
                  className={isLatestUserMessage ? "scroll-mt-28" : ""}
                >
                  <UserMessage
                    message={message}
                    copyToClipboard={(text) =>
                      handleCopyToClipboard(text, message.id)
                    }
                    isCopied={localCopiedMessageId === message.id}
                  />
                </div>
              ) : message.role === "assistant" ? (
                <AssistantMessage
                  message={message}
                  modelName={modelName}
                  copyToClipboard={(text) =>
                    handleCopyToClipboard(text, message.id)
                  }
                  isCopied={localCopiedMessageId === message.id}
                />
              ) : null}
            </React.Fragment>
          );
        })}

        {/* Show typing indicator when loading */}
        {isLoading && <TypingIndicator />}
      </div>
    </div>
  );
}
