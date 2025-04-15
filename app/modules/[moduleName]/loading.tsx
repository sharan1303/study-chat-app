import { ButtonSkeleton } from "@/components/ui/button-skeleton";
import { Loader2, MessageSquare, Trash, Search, SunMoon } from "lucide-react";

/**
 * Renders a loading skeleton for the module details page.
 *
 * This component displays placeholder UI elements that mimic the structure of the module details page
 * while the actual data is being fetched, providing visual feedback to users during loading.
 */
export default function ModuleDetailsLoading() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center px-7">
          {/* Title skeleton */}
          <div className="h-8 w-48 add-margin-for-headers bg-muted rounded mb-2" />
        </div>

        {/* Action buttons skeleton in specific order */}
        <div className="flex items-center gap-1.5 mr-3">
          {/* Go to Chat button */}
          <ButtonSkeleton
            variant="outline"
            className="flex items-center gap-2 h-9"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Go to Chat</span>
          </ButtonSkeleton>

          {/* Delete Module button */}
          <ButtonSkeleton variant="ghost" size="icon" className="h-9 w-9">
            <Trash className="h-4 w-4 text-destructive" />
          </ButtonSkeleton>

          {/* Search button */}
          <ButtonSkeleton variant="ghost" size="icon" className="h-9 w-9">
            <Search className="h-4 w-4" />
          </ButtonSkeleton>

          {/* Theme toggle */}
          <ButtonSkeleton variant="ghost" size="icon" className="h-9 w-9">
            <SunMoon className="h-4 w-4" />
          </ButtonSkeleton>
        </div>
      </div>

      <div className="space-y-13 px-3">
        {/* Context section skeleton */}
        <div className="px-4">
          <h2 className="text-lg mb-2">Context</h2>
          <div className="min-h-[186px] mr-4 p-4 bg-background rounded">
            <div className="flex items-center justify-center py-8 h-full">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        </div>

        <div className="my-5 h-px mx-4 bg-border" />

        {/* Uploads section skeleton */}
        <div className="space-y-5 px-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Uploads</h2>
          </div>

          <div className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
}
