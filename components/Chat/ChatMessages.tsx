"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";
import { Check, Copy } from "lucide-react";
import type { Message } from "@ai-sdk/react";
import { getOSModifierKey, extractSourcesFromContent } from "@/lib/utils";
import { toast } from "sonner";
import FileAttachment from "@/components/Chat/FileAttachment";
import SourcesCarousel, { Source } from "@/components/Chat/SourcesCarousel";
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
          copyToClipboard(
            typeof message.content === "string"
              ? message.content
              : "Content contains attachments"
          );
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
      <div className="rounded-xl p-4 bg-primary text-primary-foreground break-words">
        {typeof message.content === "string" ? (
          <div>{message.content}</div>
        ) : Array.isArray(message.content) ? (
          (message.content as MessageContent[]).map((part, i) => {
            if (part.type === "text") {
              return <div key={i}>{part.text}</div>;
            } else if (part.type === "file") {
              return (
                <FileAttachment
                  key={i}
                  file={part as FileContent}
                  index={i}
                  messageId={message.id}
                />
              );
            }
            return null;
          })
        ) : (
          <div>Unsupported content format</div>
        )}
      </div>
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    copyToClipboard(
                      typeof message.content === "string"
                        ? message.content
                        : "Content contains attachments"
                    );
                  }
                }}
                type="button"
                onClick={() =>
                  copyToClipboard(
                    typeof message.content === "string"
                      ? message.content
                      : "Content contains attachments"
                  )
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

  // Extract and format message content to handle sources section specially
  const formatMessageContent = (content: string) => {
    // Extract sources for the carousel
    const sources = extractSourcesFromContent(content);

    // Check if the message has a sources section (marked by "---" and "**Sources:**")
    const sourcesSectionRegex = /---\s*\n\s*\*\*Sources:\*\*/;
    if (sourcesSectionRegex.test(content)) {
      const [mainContent] = content.split(/---\s*\n/);

      return (
        <>
          <ReactMarkdown
            components={{
              code(props: any) {
                const { inline, className, children, ...rest } = props;
                // Always use CodeBlock, pass inline prop
                return (
                  <CodeBlock
                    key={Math.random()} // Consider a more stable key if possible
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

          {/* Sources carousel for visual display of sources */}
          {sources.length > 0 && <SourcesCarousel sources={sources} />}
        </>
      );
    }

    // If no sources section, render normally
    return (
      <ReactMarkdown
        components={{
          code(props: any) {
            const { inline, className, children, ...rest } = props;
            // Always use CodeBlock, pass inline prop
            return (
              <CodeBlock
                key={Math.random()} // Consider a more stable key if possible
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

  // Add keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Cmd/Ctrl+C is pressed while the message is being hovered
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        if (messageRef.current?.matches(":hover")) {
          e.preventDefault();
          copyToClipboard(
            typeof message.content === "string"
              ? message.content
              : "Content contains attachments"
          );
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
        {typeof message.content === "string" ? (
          formatMessageContent(message.content)
        ) : Array.isArray(message.content) ? (
          (message.content as MessageContent[]).map((part, i) => {
            if (part.type === "text") {
              return <div key={i}>{formatMessageContent(part.text)}</div>;
            } else if (part.type === "file") {
              return (
                <FileAttachment
                  key={i}
                  file={part as FileContent}
                  index={i}
                  messageId={message.id}
                />
              );
            }
            return null;
          })
        ) : (
          <div>Unsupported content format</div>
        )}
      </div>
      <div className="mt-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    copyToClipboard(
                      typeof message.content === "string"
                        ? message.content
                        : "Content contains attachments"
                    );
                  }
                }}
                type="button"
                onClick={() =>
                  copyToClipboard(
                    typeof message.content === "string"
                      ? message.content
                      : "Content contains attachments"
                  )
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
    <div className="flex-1 overflow-y-auto pl-4 pr-2 py-8">
      <div className="space-y-8 w-full max-w-full">
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
