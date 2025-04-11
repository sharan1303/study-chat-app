import { ButtonSkeleton } from "@/components/ui/button-skeleton";
import { Loader2, MessageSquare, Search, Trash } from "lucide-react";

/**
 * Renders a loading skeleton for the module details page.
 *
 * This component displays placeholder UI elements that mimic the structure of the module details page
 * while the actual data is being fetched, providing visual feedback to users during loading.
 */
export default function ModuleDetailsLoading() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center px-3">
          {/* Title skeleton */}
          <div className="h-8 w-48 addmarginforheaders bg-muted rounded mb-2" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center gap-3 pr-2">
          <ButtonSkeleton variant="outline" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Go to Chat</span>
          </ButtonSkeleton>
          
          <div className="flex items-center gap-2">

            <ButtonSkeleton variant="ghost" size="icon" className="h-9 w-9">
              <Trash className="h-4 w-4 text-destructive" />
            </ButtonSkeleton>

            <ButtonSkeleton variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </ButtonSkeleton>

          </div>

          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>

      <div className="space-y-6 px-7">
        {/* Description section skeleton */}
        <div className="space-y-2">
          <h2 className="text-lg mb-2">Content</h2>
          <div className="flex items-center justify-center min-h-[158px] bg-background">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          {/* <div className="flex items-center justify-center pt-12">
            <Loader2 className="h-5 w-5 animate-spin items-center justify-center" />
          </div> */}
        </div>

        <div className="my-6 h-px bg-border"></div>

        {/* Resources section skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg">Resources</h2>
          </div>

          {/* Use ResourceTableSkeleton */}
          <div className="flex items-center justify-center pt-12">
            <Loader2 className="h-5 w-5 animate-spin items-center justify-center" />
          </div>
        </div>
      </div>
    </div>
  );
}
