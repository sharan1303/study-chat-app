import { Loader2 } from "lucide-react";
import { ResourceUploadButton } from "@/components/Resource/resource-upload-button";
import { ResourceTable } from "@/components/Resource/resource-table";
import { Module, Resource } from "../module-detail-page";
import { SignInButton } from "@clerk/nextjs";

interface ModuleResourcesSectionProps {
  module: Module;
  resources: Resource[];
  allModules: { id: string; name: string; icon: string }[];
  isSignedIn: boolean | undefined;
  isResourcesLoading: boolean;
  showResourceUI: boolean;
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
}

export default function ModuleResourcesSection({
  module,
  resources,
  allModules,
  isSignedIn,
  isResourcesLoading,
  showResourceUI,
  setResources,
}: ModuleResourcesSectionProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg">Uploads</h2>
        {isSignedIn && !!resources.length && !isResourcesLoading && (
          <ResourceUploadButton variant="outline" moduleId={module.id} />
        )}
      </div>

      <div className="min-h-[300px]">
        {/* Render loading animation when resources are loading */}
        {isResourcesLoading && (
          <div className="flex items-center justify-center pt-12">
            <Loader2 className="h-5 w-5 animate-spin items-center justify-center" />
          </div>
        )}

        {/* Only render actual content after loading is complete AND showResourceUI is true */}

        {!isSignedIn && (
          <div className="flex flex-col items-center justify-center space-y-5 rounded-lg border border-dashed py-5 text-center">
            <h3 className="font-medium">
              Log in to upload your own files.
            </h3>
            <SignInButton mode="modal"/>
          </div>
        )}

        {isSignedIn && (
          <>
            {!isResourcesLoading && showResourceUI && (
              resources.length === 0 && isSignedIn ? (
            <div className="flex flex-col items-center justify-center space-y-5 rounded-lg border border-dashed py-5 text-center">
              <h3 className="font-medium">
                Access your knowledge base and upload your own files.
              </h3>
              <ResourceUploadButton
                variant="outline"
                className="text-secondary-foreground"
                moduleId={module.id}
              />
            </div>
          ) : (
            <ResourceTable
              resources={Array.isArray(resources) ? resources : []}
              modules={allModules}
              onUpdate={(updatedResource) => {
                if (updatedResource._deleted) {
                  // If resource was deleted, keep it in state but mark as deleted
                  setResources(
                    resources.map((r) =>
                      r.id === updatedResource.id
                        ? { ...r, _deleted: true }
                        : r
                    )
                  );
                } else if (updatedResource.moduleId !== module?.id) {
                  // If module changed, remove from this list
                  setResources(
                    resources.map((r) =>
                      r.id === updatedResource.id
                        ? { ...r, _deleted: true }
                        : r
                    )
                  );
                } else {
                  // Regular update
                  setResources(
                    resources.map((r) =>
                      r.id === updatedResource.id ? updatedResource : r
                    )
                  );
                }
              }}
              showModuleColumn={false}
            />
          )
            )}
          </>
        )}
      </div>
    </div>
  );
}
