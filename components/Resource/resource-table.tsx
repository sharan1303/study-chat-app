"use client";

import {
  ResourceRow,
  type Resource,
  type Module,
} from "@/components/Resource/resource-row";

interface ResourceTableProps {
  resources: Resource[];
  modules: Module[];
  onUpdate: (updatedResource: Resource) => void;
  showModuleColumn?: boolean;
}

/**
 * Renders a table displaying resource information.
 *
 * The table displays each resource (excluding those marked as deleted) as a row.
 * For loading states, use the ResourceTableSkeleton component instead.
 *
 * @param resources - An array of resource objects to display.
 * @param modules - An array of module objects used for the module column.
 * @param onUpdate - Callback invoked when a resource is updated or deleted.
 * @param showModuleColumn - Flag to determine if the module column should be shown. Defaults to true.
 */
export function ResourceTable({
  resources,
  modules,
  onUpdate,
  showModuleColumn = true,
}: ResourceTableProps) {
  return (
    <div className="overflow-x-auto border rounded-t-md">
      <table className="w-full min-w-full table-fixed">
        <thead>
          <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <th className="text-left p-2.5 w-4/12">Name</th>
            <th className="text-left p-2.5 w-2/12">Type</th>
            {showModuleColumn && (
              <th className="text-left p-2.5 w-2/12">Module</th>
            )}
            <th className="text-left p-2.5 w-2/12">Size</th>
            <th className="text-left p-2.5 w-2/12">Added</th>
            <th className="text-right p-2.5 w-1/12"></th>
          </tr>
        </thead>
        <tbody>
          {resources
            .filter((resource) => !resource._deleted)
            .map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                modules={modules}
                onUpdate={onUpdate}
                showModuleColumn={showModuleColumn}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}
