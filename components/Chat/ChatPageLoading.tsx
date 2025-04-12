"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatPageLoading() {
  return (
    <div className="min-h-[calc(100vh-var(--header-height))] flex flex-col">
      <div className="flex-1 flex flex-col pr-0">
        {/* Chat Header - Make it sticky at the top like the real header */}
        <div className="py-4 px-1 pl-12 flex items-center justify-between add-margin-for-headers top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>

        <div className="flex-1">
          <div className="max-w-3xl mx-auto w-full transition-all duration-200">
            <div className="px-0">
              <div className="flex items-center justify-center h-screen z-20">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input form skeleton */}
        <div className="sticky bottom-0 bg-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Skeleton
                variant="input"
                className="flex-1 min-h-[120px] max-h-[400px] resize-none w-full"
              />
              <Skeleton className="absolute right-3 top-3 h-10 w-10 rounded-lg bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
