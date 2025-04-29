import React from "react";

/**
 * A typing indicator that shows three animated dots to indicate
 * that the AI is composing a response, similar to iMessage
 */
export default function TypingIndicator() {
  return (
    <div className="flex flex-col items-start mb-4">
      <div className="bg-card p-2 rounded-xl flex items-center space-x-1.5">
        <span
          className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce"
          style={{ animationDuration: "0.6s", animationDelay: "0ms" }}
        ></span>
        <span
          className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce"
          style={{ animationDuration: "0.6s", animationDelay: "0.2s" }}
        ></span>
        <span
          className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce"
          style={{ animationDuration: "0.6s", animationDelay: "0.4s" }}
        ></span>
      </div>
    </div>
  );
}
