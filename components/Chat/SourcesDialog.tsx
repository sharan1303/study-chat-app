"use client";

import { useState } from "react";
import { ExternalLink, Globe, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchLinkPreview } from "@/lib/api";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import React from "react";

export interface Source {
  title: string;
  url: string;
  favicon?: string;
}

export interface FileAttachment {
  name: string;
  type: string;
  size?: number;
  url?: string;
}

interface SourcePreview extends Source {
  image?: string;
  description?: string;
  isLoading?: boolean;
}

interface SourcesDialogProps {
  sources?: Source[];
  files?: FileAttachment[];
}

export default function SourcesDialog({
  sources = [],
  files = [],
}: SourcesDialogProps) {
  // Debug logging
  console.log("SourcesDialog initialized with:", {
    sourceCount: sources.length,
    fileCount: files.length,
    files: files,
  });

  // Generate a key based on the content to ensure component resets when sources/files change
  const dialogKey = React.useMemo(() => {
    const sourceIds = sources.map((s) => s.url).join("|");
    const fileIds = files.map((f) => f.name + f.type).join("|");
    return `${sourceIds}:${fileIds}`;
  }, [sources, files]);

  const [sourcePreviews, setSourcePreviews] = useState<SourcePreview[]>(
    sources.map((source) => ({ ...source, isLoading: true }))
  );
  const [open, setOpen] = useState(false);
  const hasSources = sources.length > 0;
  const hasFiles = files.length > 0;
  const activeTab = hasSources ? "sources" : "files";

  // Reset sourcePreviews when sources change
  useEffect(() => {
    if (sources.length > 0) {
      setSourcePreviews(
        sources.map((source) => ({ ...source, isLoading: true }))
      );
    }
  }, [sources]);

  // Fetch link previews for all sources
  useEffect(() => {
    if (!hasSources || !open) return;

    const loadPreviews = async () => {
      const updatedPreviews = await Promise.all(
        sources.map(async (source) => {
          try {
            const preview = await fetchLinkPreview(source.url);

            return {
              ...source,
              image: preview.image || undefined,
              description: preview.description || undefined,
              favicon: preview.favicon || source.favicon,
              title: source.title || preview.title,
              isLoading: false,
            };
          } catch (error) {
            console.error(`Error fetching preview for ${source.url}:`, error);
            return { ...source, isLoading: false };
          }
        })
      );

      setSourcePreviews(updatedPreviews);
    };

    loadPreviews();
  }, [sources, open, hasSources]);

  // Log when component is unmounted without showing
  useEffect(() => {
    return () => {
      if (!open && (hasSources || hasFiles)) {
        console.log("SourcesDialog unmounted without being opened", {
          hasSources,
          hasFiles,
          sourceCount: sources.length,
          fileCount: files.length,
        });
      }
    };
  }, [open, hasSources, hasFiles, sources.length, files.length]);

  if (!hasSources && !hasFiles) {
    console.log("SourcesDialog rendering null: no sources or files");
    return null;
  }

  const itemCount = sources.length + files.length;
  const buttonLabel =
    hasSources && hasFiles
      ? `Sources & Files (${itemCount})`
      : hasSources
      ? `Sources (${sources.length})`
      : `Files (${files.length})`;

  console.log("SourcesDialog rendering button with label:", buttonLabel);

  return (
    <div className="mt-2 mb-2">
      <Dialog key={dialogKey} open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 bg-muted/60 hover:bg-muted"
          >
            {hasSources && !hasFiles && (
              <Globe className="h-4 w-4 text-muted-foreground" />
            )}
            {!hasSources && hasFiles && (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            {hasSources && hasFiles && (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{buttonLabel}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {hasSources && hasFiles
                ? "Sources & Files"
                : hasSources
                ? "Sources"
                : "Files"}
            </DialogTitle>
          </DialogHeader>

          {hasSources && hasFiles ? (
            <Tabs defaultValue={activeTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sources">
                  Sources ({sources.length})
                </TabsTrigger>
                <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="sources">
                <SourcesList sources={sourcePreviews} />
              </TabsContent>
              <TabsContent value="files">
                <FilesList files={files} />
              </TabsContent>
            </Tabs>
          ) : hasSources ? (
            <SourcesList sources={sourcePreviews} />
          ) : (
            <FilesList files={files} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SourcesList({ sources }: { sources: SourcePreview[] }) {
  return (
    <div className="space-y-3 mt-4">
      {sources.map((source, index) => (
        <a
          key={index}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            {source.favicon ? (
              <img
                src={source.favicon}
                alt=""
                className="w-6 h-6 mt-0.5 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="w-6 h-6 mt-0.5 text-muted-foreground" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-foreground line-clamp-1">
                  {source.title || "Untitled Source"}
                </h3>
                <ExternalLink className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              </div>

              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {source.description ||
                  (() => {
                    try {
                      const url = new URL(source.url);
                      return url.hostname;
                    } catch (e) {
                      return source.url;
                    }
                  })()}
              </p>

              <p className="text-xs text-muted-foreground mt-2 truncate">
                {source.url}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function FilesList({ files }: { files: FileAttachment[] }) {
  return (
    <div className="space-y-3 mt-4">
      {files.map((file, index) => {
        // Determine if the file is an image that can be previewed
        const isImage = file.type.startsWith("image/");

        return (
          <div
            key={index}
            className={cn(
              "block p-3 border border-border rounded-lg",
              file.url ? "hover:bg-muted/50 cursor-pointer" : ""
            )}
            onClick={() => file.url && window.open(file.url, "_blank")}
          >
            <div className="flex items-start gap-3">
              {isImage && file.url ? (
                <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <FileText className="w-6 h-6 mt-0.5 text-muted-foreground" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-foreground line-clamp-1">
                    {file.name}
                  </h3>
                  {file.url && (
                    <ExternalLink className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  {file.type}
                  {file.size && ` · ${formatFileSize(file.size)}`}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  else return (bytes / 1073741824).toFixed(1) + " GB";
}
