import { ButtonSkeleton } from "@/components/ui/button-skeleton";
import { Edit, Loader, MessageSquare, Search, Trash } from "lucide-react";

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
        <div className="flex items-center">
          {/* Title skeleton */}
          <div className="h-8 w-48 addmarginforheaders bg-muted rounded mb-2" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center gap-1">
          <ButtonSkeleton variant="outline" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Go to Chat
          </ButtonSkeleton>
          <div className="flex items-center gap-1 mr-6">
            <ButtonSkeleton variant="ghost" size="icon" className="h-9 w-9">
              <Edit className="h-4 w-4" />
            </ButtonSkeleton>

            <ButtonSkeleton variant="ghost" size="icon" className="h-9 w-9">
              <Trash className="h-4 w-4 text-destructive" />
            </ButtonSkeleton>

            <ButtonSkeleton variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </ButtonSkeleton>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-3">
        {/* Description section skeleton */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-2">Provide content</h2>
          <div className="text-muted-foreground p-4 rounded min-h-[158px] bg-muted">
          </div>
        </div>

        <div className="my-6 h-px bg-border"></div>

        {/* Resources section skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold">Resources</h2>
          </div>

          {/* Use ResourceTableSkeleton */}
          <Loader className="h-4 w-4 animate-spin items-center justify-center" />
        </div>
      </div>
    </div>
  );
}
