"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  chatLoading: boolean;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function ChatInput({
  input,
  handleInputChange,
  handleFormSubmit,
  chatLoading,
  handleKeyDown,
}: ChatInputProps) {
  return (
    <div className="sticky bottom-0 bg-transparent">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleFormSubmit}>
          <div className="relative">
            <Textarea
              placeholder="Type your message here..."
              value={input}
              onChange={handleInputChange}
              className="flex-1 min-h-[120px] max-h-[400px] border-5 rounded-t-2xl rounded-b-none resize-none w-full border-b-0 p-4"
              rows={4}
              autoFocus
              onKeyDown={handleKeyDown}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-3 top-3 h-10 w-10 rounded-lg"
              disabled={chatLoading || !input.trim()}
            >
              {chatLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
