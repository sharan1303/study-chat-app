"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchLinkPreview } from "@/lib/api";

export interface Source {
  title: string;
  url: string;
  favicon?: string;
}

interface SourcePreview extends Source {
  image?: string;
  description?: string;
  isLoading?: boolean;
}

interface SourcesCarouselProps {
  sources: Source[];
}

export default function SourcesCarousel({ sources }: SourcesCarouselProps) {
  const [sourcePreviews, setSourcePreviews] = useState<SourcePreview[]>(
    sources.map((source) => ({ ...source, isLoading: true }))
  );

  // Fetch link previews for all sources
  useEffect(() => {
    const loadPreviews = async () => {
      const updatedPreviews = await Promise.all(
        sources.map(async (source) => {
          try {
            const preview = await fetchLinkPreview(source.url);

            if (preview && preview.success) {
              return {
                ...source,
                image: preview.image || undefined,
                description: preview.description || undefined,
                favicon: preview.favicon || undefined,
                isLoading: false,
              };
            }
          } catch (error) {
            console.error(`Error fetching preview for ${source.url}:`, error);
          }

          // Return original source if preview fetch failed
          return { ...source, isLoading: false };
        })
      );

      setSourcePreviews(updatedPreviews);
    };

    loadPreviews();
  }, [sources]);

  if (!sources.length) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium mb-3">Sources:</h3>

      <div className="relative">
        <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
          {sourcePreviews.map((source, index) => (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex-none relative w-64 h-36 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group",
                "hover:ring-2 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              )}
            >
              {source.image ? (
                // Show image preview if available - using regular img tag for external URLs
                <div className="relative w-full h-full">
                  <img
                    src={source.image}
                    alt={source.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient if image loading fails
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                // Placeholder with gradient background
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center p-4">
                    {source.favicon ? (
                      <div className="w-10 h-10 mb-2 flex-shrink-0">
                        <img
                          src={source.favicon}
                          alt=""
                          className="w-10 h-10 rounded object-contain"
                          onError={(e) => {
                            // Fallback to Globe icon if favicon fails to load
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 mb-2 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </div>
                    )}
                    <span className="text-sm text-center text-gray-700 dark:text-gray-300 line-clamp-2">
                      {new URL(source.url).hostname}
                    </span>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {source.isLoading && (
                <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-800/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Source title overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm line-clamp-2 font-medium">
                  {source.title || "Source"}
                </p>
              </div>

              {/* Link icon */}
              <div className="absolute top-2 right-2 bg-gray-800/60 text-white w-6 h-6 rounded-full flex items-center justify-center">
                <ExternalLink className="w-3 h-3" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
