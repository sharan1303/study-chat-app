"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";
import { Check, Copy } from "lucide-react";
import type { Message } from "@ai-sdk/react";
import { ShortcutIndicator } from "@/components/ui/shortcut-indicator";

export interface ChatMessagesProps {
  messages: Message[];
  copiedMessageId: string | null;
  copyToClipboard: (text: string, messageId: string) => void;
  modelName: string;
}

const UserMessage: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div key={`user-${message.id}`} className="flex justify-end">
      <div className="flex items-center gap-2 max-w-full flex-row-reverse">
        <div className="rounded-xl p-4 bg-primary text-primary-foreground break-words">
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        </div>
      </div>
    </div>
  );
};

const AssistantMessage: React.FC<{
  message: Message;
  copyToClipboard: (text: string, messageId: string) => void;
  copiedMessageId: string | null;
  modelName: string;
}> = ({ message, copyToClipboard, copiedMessageId, modelName }) => {
  const messageRef = React.useRef<HTMLDivElement>(null);

  // Add keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Cmd/Ctrl+C is pressed while the message is being hovered
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        if (messageRef.current?.matches(":hover")) {
          e.preventDefault();
          copyToClipboard(message.content, message.id);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [message.content, message.id, copyToClipboard]);

  return (
    <div
      ref={messageRef}
      key={`assistant-${message.id}`}
      className="text-gray-800 dark:text-gray-200 group relative"
    >
      <div className="prose prose-xs dark:prose-invert max-w-none break-words prose-spacing text-sm">
        <ReactMarkdown
          components={{
            h1: (props) => (
              <h1
                className="text-xl font-bold my-5"
                {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
              />
            ),
            h2: (props) => (
              <h2
                className="text-lg font-semibold my-4"
                {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
              />
            ),
            h3: (props) => (
              <h3
                className="text-lg font-medium my-4"
                {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
              />
            ),
            h4: (props) => (
              <h4
                className="text-lg font-medium my-3"
                {...(props as React.HTMLAttributes<HTMLHeadingElement>)}
              />
            ),
            p: (props) => (
              <p
                className="my-3"
                {...(props as React.HTMLAttributes<HTMLParagraphElement>)}
              />
            ),
            // @ts-expect-error - ReactMarkdown types don't include inline
            code: ({ inline, className, children, ...props }) => {
              return (
                <CodeBlock inline={inline} className={className} {...props}>
                  {children}
                </CodeBlock>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
      <div className="mt-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
        <button
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              copyToClipboard(message.content, message.id);
            }
          }}
          type="button"
          onClick={() => copyToClipboard(message.content, message.id)}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          aria-label="Copy response"
          title="Copy message (or use Cmd/Ctrl+C while hovering)"
        >
          {copiedMessageId === message.id ? (
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>Copied!</span>
            </span>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="ml-2 text-sm">Copy Message</span>
              <ShortcutIndicator shortcutKey="C" className="ml-1" />
            </>
          )}
        </button>
        <div className="text-xs text-muted-foreground">
          Generated with {modelName}
        </div>
      </div>
    </div>
  );
};

const ChatMessages = React.memo(function ChatMessages({
  messages,
  copiedMessageId,
  copyToClipboard,
  modelName,
}: ChatMessagesProps) {
  return (
    <>
      {messages.map((message, index) => {
        return (
          <React.Fragment key={message.id || index}>
            {message.role === "user" ? (
              <UserMessage message={message} />
            ) : message.role === "assistant" ? (
              <AssistantMessage
                message={message}
                copyToClipboard={copyToClipboard}
                copiedMessageId={copiedMessageId}
                modelName={modelName}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
});

export default ChatMessages;
