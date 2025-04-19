"use client";

import React, { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Paperclip, X } from "lucide-react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  chatLoading: boolean;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  files?: FileList | null;
  setFiles?: (files: FileList | null) => void;
}

export default function ChatInput({
  input,
  handleInputChange,
  handleFormSubmit,
  chatLoading,
  handleKeyDown,
  files,
  setFiles,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles?.(e.target.files);
      const names = Array.from(e.target.files).map((file) => file.name);
      setFileNames(names);
    }
  };

  const handleClearFiles = () => {
    setFiles?.(null);
    setFileNames([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="sticky bottom-0 bg-transparent">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleFormSubmit}>
          {fileNames.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-t-2xl flex flex-wrap gap-2">
              {fileNames.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center bg-slate-200 dark:bg-slate-700 rounded px-2 py-1 text-sm"
                >
                  <span className="truncate max-w-xs">{name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1"
                    onClick={handleClearFiles}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <Textarea
              placeholder="Type your message here..."
              value={input}
              onChange={handleInputChange}
              className={`flex-1 min-h-[120px] max-h-[400px] border-5 ${
                fileNames.length > 0 ? "rounded-t-none" : "rounded-t-2xl"
              } rounded-b-none resize-none w-full border-b-0 p-4`}
              rows={4}
              autoFocus
              onKeyDown={handleKeyDown}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              aria-label="Upload attachments"
            />
            <div className="absolute right-3 top-3 flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={chatLoading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-lg"
                disabled={
                  chatLoading ||
                  (!input.trim() && (!files || files.length === 0))
                }
              >
                {chatLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
