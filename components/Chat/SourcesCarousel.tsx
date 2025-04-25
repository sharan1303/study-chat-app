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

            // Use preview data whether success is true or false
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
            // Return original source if preview fetch failed completely
            return { ...source, isLoading: false };
          }
        })
      );

      setSourcePreviews(updatedPreviews);
    };

    loadPreviews();
  }, [sources]);

  if (!sources.length) return null;

  return (
    <div className="mt-4 pt-2 border-t border-border w-full max-w-full">
      <h3 className="text-sm font-medium mb-3">Sources:</h3>

      <div className="relative w-full">
        <div className="flex overflow-x-auto gap-2 sm:gap-3 md:gap-4 pb-2 scrollbar-hide snap-x snap-mandatory">
          {sourcePreviews.map((source, index) => (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex-none relative snap-start rounded-lg overflow-hidden border border-muted dark:border-gray-700 group",
                "focus:outline-none hover:ring-1 focus:ring-1 transition-all",
                "xs:w-32 sm:w-32 md:w-32 lg:w-64",
                "h-36"
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
                            // Show Globe icon instead
                            const parent = (e.target as HTMLImageElement)
                              .parentElement;
                            if (parent) {
                              const globeIcon = document.createElement("div");
                              globeIcon.className =
                                "w-10 h-10 flex items-center justify-center";
                              globeIcon.innerHTML =
                                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-gray-700 dark:text-gray-300"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';
                              parent.appendChild(globeIcon);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 mb-2 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      </div>
                    )}
                    <span className="text-sm text-center text-gray-700 dark:text-gray-300 line-clamp-2">
                      {(() => {
                        try {
                          const url = new URL(source.url);
                          return url.hostname;
                        } catch (e) {
                          return source.url;
                        }
                      })()}
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
