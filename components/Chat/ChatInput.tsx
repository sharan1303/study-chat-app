"use client";

import React, { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, Globe, Square } from "lucide-react";
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
  handleStopGeneration?: () => void;
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
  handleStopGeneration,
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
  const [fileArray, setFileArray] = useState<File[]>([]);

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
      const filesArr = Array.from(files);
      setFileArray(filesArr);
      const names = filesArr.map((file) => file.name);
      setFileNames(names);
    }
    // Only clear filenames if files is explicitly null/undefined, not on every render without files
    // This prevents the banner from disappearing when the component rerenders
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Log file info for debugging
      logAttachments(e.target.files);

      const filesArr = Array.from(e.target.files);
      setFileArray(filesArr);
      setFiles?.(e.target.files);
      const names = filesArr.map((file) => file.name);
      setFileNames(names);
    }
  };

  // Helper function to log file attachments for debugging
  const logAttachments = async (files: FileList) => {
    try {
      // Create an array of attachment data to log
      const attachmentsToLog = await Promise.all(
        Array.from(files).map(async (file) => {
          return {
            name: file.name,
            mimeType: file.type,
            size: file.size,
            // We don't need to send the full data for logging
            data: "data-preview-removed-for-logging",
          };
        })
      );

      // Send to our logging endpoint
      await fetch("/api/chat/attachments-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attachments: attachmentsToLog }),
      });
    } catch (error) {
      console.error("Error logging attachments:", error);
    }
  };

  const handleClearAllFiles = () => {
    setFiles?.(null);
    setFileNames([]);
    setFileArray([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearFile = (index: number) => {
    // Remove the file at the specified index
    const newFileArray = [...fileArray];
    newFileArray.splice(index, 1);

    // Update the fileNames array
    const newFileNames = [...fileNames];
    newFileNames.splice(index, 1);

    setFileArray(newFileArray);
    setFileNames(newFileNames);

    // If there are no files left, clear the input
    if (newFileArray.length === 0) {
      setFiles?.(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      // Convert the array back to a FileList-like object
      const dataTransfer = new DataTransfer();
      newFileArray.forEach((file) => {
        dataTransfer.items.add(file);
      });
      setFiles?.(dataTransfer.files);
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
            <div className="bg-card dark:bg-card p-2 rounded-t-2xl flex flex-wrap gap-2">
              {fileNames.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center bg-muted dark:bg-slate-700 rounded px-2 py-1 text-sm group hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <span className="truncate max-w-xs">{name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-red-100 dark:hover:bg-black/30 rounded-full"
                    onClick={() => handleClearFile(index)}
                    aria-label={`Remove ${name}`}
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
              } rounded-b-none w-full p-4 pr-24 bg-input resize-none
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
              accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.ico,.webp"
              // accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.ico,.webp,.csv,.xls,.xlsx,.ppt,.pptx"
              multiple
              aria-label="Upload attachments"
            />
            <div className="absolute right-3 top-3 flex gap-2">
              {selectedModel !== "gpt-4o-mini" && (
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
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {chatLoading ? (
                      <Button
                        type="button"
                        size="icon"
                        className="h-10 w-10 rounded-lg"
                        onClick={handleStopGeneration}
                        aria-label="Stop generation"
                      >
                        <Square className="h-5 w-5 fill-current" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 rounded-lg"
                        disabled={
                          !input.trim() && (!files || files.length === 0)
                        }
                        aria-label="Send message"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {chatLoading ? "Stop generation" : "Send message"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex bg-input pl-1 gap-2">
              <Select
                value={selectedModel}
                onValueChange={(value) => {
                  onModelChange(value as ModelId);
                }}
              >
                <SelectTrigger className="max-w-[200px] h-8 focus:ring-0">
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
                        className="h-8 min-w-24 rounded-lg"
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
