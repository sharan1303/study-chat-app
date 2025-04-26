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

export interface ChatMessagesProps {
  messages: Message[];
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  modelName: string;
  isLoading?: boolean;
  copyToClipboard?: (text: string, messageId: string) => void;
  copiedMessageId?: string | null;
  stop?: () => void;
}

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
  isAssistant: boolean
) => {
  // Collect file attachments for the SourcesDialog
  const files: FileAttachmentType[] = [];

  if (typeof content === "string") {
    if (isAssistant) {
      // Format assistant message with markdown and handle sources
      return formatAssistantContent(content);
    }
    // Simple text rendering for user messages
    return <div>{content}</div>;
  }

  if (Array.isArray(content)) {
    // Extract file attachments
    content.forEach((part) => {
      if (part.type === "file") {
        const fileContent = part as FileContent;
        files.push({
          name: fileContent.name || `File${files.length + 1}`,
          type: fileContent.mimeType,
          url: `data:${fileContent.mimeType};base64,${fileContent.data}`,
          size: fileContent.data
            ? Math.ceil(fileContent.data.length * 0.75)
            : undefined, // Estimate size from base64
        });
      }
    });

    const textContent = content.filter((part) => part.type === "text");

    return (
      <div className="w-full">
        {files.length > 0 && (
          <div className="mb-4">
            <SourcesDialog files={files} />
          </div>
        )}

        {/* Render text parts */}
        {textContent.map((part, i) => {
          if (part.type === "text") {
            return isAssistant ? (
              <div key={i}>{formatAssistantContent(part.text)}</div>
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
const formatAssistantContent = (content: string) => {
  // Extract sources for the dialog
  const sources = extractSourcesFromContent(content);

  // Check if the message has a sources section
  const sourcesSectionRegex = /---\s*\n\s*\*\*Sources:\*\*/;
  if (sourcesSectionRegex.test(content)) {
    const [mainContent] = content.split(/---\s*\n/);

    return (
      <>
        {sources.length > 0 && <SourcesDialog sources={sources} />}
        <ReactMarkdown
          components={{
            code(props: any) {
              const { inline, className, children, ...rest } = props;
              return (
                <CodeBlock
                  key={Math.random()}
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
  }

  // If no sources section, render normally
  return (
    <ReactMarkdown
      components={{
        code(props: any) {
          const { inline, className, children, ...rest } = props;
          return (
            <CodeBlock
              key={Math.random()}
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
      {content}
    </ReactMarkdown>
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
      className="flex flex-col items-end group relative"
    >
      <div className="rounded-xl p-4 bg-card text-card-foreground break-words">
        {renderMessageContent(message.content, message.id, false)}
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
      className="text-gray-800 dark:text-gray-200 group relative"
    >
      <div className="prose prose-xs dark:prose-invert max-w-none w-full break-words prose-spacing text-sm">
        {renderMessageContent(message.content, message.id, true)}
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
  return (
    <div className="flex-1 overflow-y-auto pt-14">
      <div className=" max-w-3xl mx-auto px-3">
        {messages.map((message, index) => {
          return (
            <React.Fragment key={message.id || index}>
              {message.role === "user" ? (
                <UserMessage
                  message={message}
                  copyToClipboard={(text) =>
                    handleCopyToClipboard(text, message.id)
                  }
                  isCopied={localCopiedMessageId === message.id}
                />
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
      </div>
    </div>
  );
}
