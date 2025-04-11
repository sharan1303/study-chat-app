"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";
import { Check, Copy } from "lucide-react";
import type { Message } from "@ai-sdk/react";

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
  return (
    <div
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
            code: (props) => <CodeBlock {...props} />,
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
          className="text-xs px-2 py-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          aria-label="Copy response"
        >
          {copiedMessageId === message.id ? (
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>Copied!</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Copy className="h-4 w-4" />
              <span>Copy Response</span>
            </span>
          )}
        </button>
        <div className="text-xs text-muted-foreground">
          Generated with {modelName}
        </div>
      </div>
    </div>
  );
};

export default function ChatMessages({
  messages,
  copiedMessageId,
  copyToClipboard,
  modelName,
}: ChatMessagesProps) {
  return (
    <>
      {messages.map((message, index) => {
        if (message.role === "user") {
          const nextMessage = messages[index + 1];
          return (
            <React.Fragment key={message.id || index}>
              <UserMessage message={message} />
              {nextMessage && nextMessage.role === "assistant" && (
                <AssistantMessage
                  message={nextMessage}
                  copyToClipboard={copyToClipboard}
                  copiedMessageId={copiedMessageId}
                  modelName={modelName}
                />
              )}
            </React.Fragment>
          );
        }
        if (index === 0 && message.role === "assistant") {
          return (
            <AssistantMessage
              key={message.id || index}
              message={message}
              copyToClipboard={copyToClipboard}
              copiedMessageId={copiedMessageId}
              modelName={modelName}
            />
          );
        }
        return null;
      })}
    </>
  );
}
