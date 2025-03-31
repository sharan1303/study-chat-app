import { ButtonSkeleton } from "@/components/ui/button-skeleton";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "@/components/ui/static-icon";
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
      <div className="flex items-center justify-between px-3 py-3.5">
        <h1 className="font-bold text-xl">Categories</h1>
      </div>

      {/* Tabs with static labels */}
      <div className="px-3">
        <div className="grid w-full max-w-md grid-cols-2 h-9 bg-muted rounded-lg">
          <div className="flex items-center justify-center mt-1 ml-1 h-7 bg-background rounded-lg">
            <span className="font-medium text-sm">Modules</span>
          </div>
          <div className="flex items-center justify-center mt-1 mr-1 h-7 w-auto rounded-sm">
            <span className="font-medium text-sm text-muted-foreground">
              All Resources
            </span>
          </div>
        </div>

        {/* Search bar and button skeleton */}
        <div className="relative flex items-center gap-2 mt-4 mb-6">
          <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={"Search modules..."}
                className="pl-10"
              />
          </div>
          <ButtonSkeleton variant="outline" className="opacity-100">
            <PlusIcon />
            Create Module
          </ButtonSkeleton>
        </div>

        {/* Empty area for modules to load into */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
          {/* No skeleton cards as requested */}
        </div>
      </div>
    </div>
  );
}
