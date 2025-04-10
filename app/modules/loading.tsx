import { ButtonSkeleton } from "@/components/ui/button-skeleton";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { Search } from "lucide-react";

/**
 * Renders a loading skeleton for the modules page.
 *
 * This component displays a placeholder UI that mimics the layout of the modules page while data is loading.
 * It includes a header for "Categories", static tabs for "Modules" and "All Resources", a search bar skeleton,
 * and a disabled "Create Module" button with a Plus icon.
 */
export default function Loading() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between px-6 pt-4">
        <h1 className="addmarginforheaders text-xl">Dashboard</h1>
      </div>

      {/* Tabs with static labels */}
      <div className="px-6">
        <div className="grid w-full max-w-xl grid-cols-2 h-9 bg-muted rounded-lg">
          <div className="flex items-center justify-center mt-1 ml-1 h-7 bg-background rounded-md">
            <span className="font-medium text-sm">Modules</span>
          </div>
          <div className="flex items-center justify-center mt-1 h-7 w-auto rounded-sm">
            <span className="pr-1 font-medium text-sm text-muted-foreground">
              Resources
            </span>
          </div>
        </div>

        {/* Search bar and button skeleton */}
        <div className="flex items-center gap-2 pl-0.5 mt-4 mb-6 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search modules..."
              className="pl-10"
              aria-label="Search modules"
            />
          </div>
          <ButtonSkeleton variant="outline" className="opacity-100">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Create Module</span>
          </ButtonSkeleton>
        </div>

        {/* Empty area for modules to load into */}
        <div className="flex items-center justify-center pt-12">
              <Loader2 />
        </div>
    </div>
  </div>
  );
}
