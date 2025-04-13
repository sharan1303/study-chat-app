"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { encodeModuleSlug, getOSModifierKey } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, Search } from "lucide-react";

import ModuleDetailsLoading from "@/app/modules/[moduleName]/loading";
import ThemeToggle from "@/components/ui/theme-toggle";

import ModuleIconEditor from "@/components/Modules/components/ModuleIconEditor";
import ModuleTitle from "@/components/Modules/components/ModuleTitle";
import ModuleContextEditor from "@/components/Modules/components/ModuleContextEditor";
import ModuleResourcesSection from "@/components/Modules/components/ModuleResourcesSection";
import { useModuleData } from "@/components/Modules/hooks/useModuleData";
import DeleteModule from "@/components/dialogs/DeleteModuleDialog";

/**
 * Client component that handles the module detail functionality.
 *
 * This component fetches module data based on a module name provided via URL parameters and displays the module's icon,
 * title, content, and its associated resources. It supports editing the module's title, content, and icon, with updates
 * triggering either a full page refresh (for name changes) or a component refresh (for content and icon changes).
 */
export default function ModuleDetailWrapper({
  moduleName,
  prefetchedResources = [],
}: {
  moduleName: string;
  prefetchedResources?: Resource[];
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  const {
    module,
    resources,
    allModules,
    isLoading,
    isResourcesLoading,
    showResourceUI,
    errorMessage,
    setResources,
    updateModule,
  } = useModuleData(moduleName, prefetchedResources, isSignedIn);

  // Handle retry function for cases where module might not load on first try
  const handleRetry = () => {
    if (retryCount < 3) {
      // Limit retries to prevent infinite loops
      setRetryCount((prev) => prev + 1);
      router.refresh(); // Refresh the page to try loading again
    }
  };

  // Format module name for URL
  const formatModuleNameForUrl = (name: string) => {
    return encodeModuleSlug(name);
  };

  // Handle search click
  const handleSearchClick = () => {
    // Trigger Command+K dialog by simulating the keyboard shortcut
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
    });
    document.dispatchEvent(event);
  };

  // Render error state with retry button
  if (errorMessage && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4">
        <h2 className="text-xl font-semibold mb-4">Error Loading Module</h2>
        <p className="text-muted-foreground mb-6 text-center">{errorMessage}</p>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/modules")}>
            Back to Modules
          </Button>
          {retryCount < 3 && (
            <Button variant="outline" onClick={handleRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ModuleDetailsLoading />;
  }

  // Return null (invisible component) if module isn't loaded
  if (!module) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center pl-4">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              className="add-margin-for-headers"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ChevronLeft className="h-10 w-10" />
            </Button>

            {/* Module icon editor */}
            <ModuleIconEditor icon={module.icon} updateModule={updateModule} />

            {/* Module title */}
            <ModuleTitle module={module} updateModule={updateModule} />
          </div>

          {/* Action buttons in specific order */}
          <div className="flex items-center gap-1.5 mr-3">
            {/* Go to Chat button */}
            <Button
              className="flex items-center gap-2"
              variant="outline"
              onClick={() =>
                router.push(`/${formatModuleNameForUrl(module.name)}/chat`)
              }
            >
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Go to Chat</span>
            </Button>

            {/* Delete Module button */}
            <DeleteModule moduleId={module.id} moduleName={module.name} />

            {/* Search button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchClick}
              title={`Search (${getOSModifierKey()}+K)`}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>

        <div className="space-y-13 px-3">
          <div className="px-4">
            <h2 className="text-lg mb-2">Context</h2>
            {/* Module context editor */}
            <ModuleContextEditor module={module} updateModule={updateModule} />
          </div>

          <Separator className="my-5 mx-4" />

          {/* Resources section */}
          <ModuleResourcesSection
            module={module}
            resources={resources}
            allModules={allModules}
            isSignedIn={isSignedIn}
            isResourcesLoading={isResourcesLoading}
            showResourceUI={showResourceUI}
            setResources={setResources}
          />
        </div>
      </div>
    </div>
  );
}

// Types
export interface Module {
  id: string;
  name: string;
  context: string | null;
  icon: string;
  resourceCount: number;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  type: string;
  fileUrl: string | null;
  moduleId: string;
  moduleName?: string | null;
  createdAt: string;
  updatedAt?: string;
  _deleted?: boolean; // For UI tracking of deleted resources
}
