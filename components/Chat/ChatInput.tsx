"use client";

import React, { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Paperclip, X, Globe, ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_MODELS, ModelId, getDefaultModelId } from "@/lib/models";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  chatLoading: boolean;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  files?: FileList | null;
  setFiles?: (files: FileList | null) => void;
  webSearchEnabled?: boolean;
  setWebSearchEnabled?: (enabled: boolean) => void;
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  availableModels?: typeof AVAILABLE_MODELS;
}

export default function ChatInput({
  input,
  handleInputChange,
  handleFormSubmit,
  chatLoading,
  handleKeyDown,
  files,
  setFiles,
  webSearchEnabled = false,
  setWebSearchEnabled,
  selectedModel = getDefaultModelId(),
  onModelChange,
  availableModels = AVAILABLE_MODELS,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);

  // Function to adjust textarea height based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto so we can determine the scroll height
      textarea.style.height = "auto";

      // Calculate the scroll height and set the new height
      // Respect the min/max heights set in the CSS
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  // Call the adjust function whenever input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Update fileNames when files prop changes (e.g., when navigating back to a chat)
  useEffect(() => {
    if (files && files.length > 0) {
      const names = Array.from(files).map((file) => file.name);
      setFileNames(names);
    }
    // Only clear filenames if files is explicitly null/undefined, not on every render without files
    // This prevents the banner from disappearing when the component rerenders
  }, [files]);

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

  const toggleWebSearch = () => {
    if (setWebSearchEnabled) {
      setWebSearchEnabled(!webSearchEnabled);
    }
  };

  // Custom handler for input changes to accommodate both auto-resize and external handler
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
  };

  return (
    <div className="sticky bottom-0 bg-none">
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
          <div className="relative custom-scrollbar">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message here..."
              value={input}
              onChange={handleTextareaChange}
              className={`flex-1 min-h-[120px] max-h-[300px] ${
                fileNames.length > 0 ? "rounded-t-none" : "rounded-t-2xl"
              } rounded-b-none w-full p-4 pr-24 bg-input
              `}
              rows={1}
              autoFocus
              onKeyDown={handleKeyDown}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.ico,.webp"
              multiple
              aria-label="Upload attachments"
            />
            <div className="absolute right-3 top-3 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={chatLoading}
                      aria-label="Upload attachments"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Upload attachments
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      className="h-10 w-10 rounded-lg"
                      disabled={
                        chatLoading ||
                        (!input.trim() && (!files || files.length === 0))
                      }
                      aria-label="Send message"
                    >
                      {chatLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex bg-input bottom-1 left-1 gap-2">
              <Select
                value={selectedModel}
                onValueChange={(value) => {
                  onModelChange(value as ModelId);
                }}
              >
                <SelectTrigger className="max-w-[210px] h-8 focus:ring-0">
                  <SelectValue
                    placeholder={
                      availableModels.find(
                        (model) => model.id === selectedModel
                      )?.name || "Select Model"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedModel !== "gpt-4o-mini" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant={webSearchEnabled ? "default" : "ghost"}
                        className="h-8 w-24 rounded-lg"
                        onClick={toggleWebSearch}
                        disabled={chatLoading}
                        aria-label={
                          webSearchEnabled
                            ? "Disable web search"
                            : "Enable web search"
                        }
                      >
                        <Globe className="h-4 w-4 pb-0.5" />
                        Search
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {webSearchEnabled
                        ? "Disable web search"
                        : "Enable web search"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
