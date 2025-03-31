/**
 * A server component that renders a skeleton loading state for the ResourceTable.
 *
 * This component mimics the structure of ResourceTable without requiring client-side
 * functionality, allowing it to be used within server components.
 *
 * @param showModuleColumn - Flag to determine if the module column should be shown. Defaults to true.
 */
export function ResourceTableSkeleton({
  showModuleColumn = true,
}: {
  showModuleColumn?: boolean;
}) {
  return (
    <div className="overflow-x-auto border rounded-md">
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
            <th className="text-left p-2.5 w-1/12"></th>
          </tr>
        </thead>
        <tbody>
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <tr key={index} className="border-b animate-pulse">
                <td className="p-2.5">
                  <div className="flex items-center">
                    <div className="mr-3 bg-muted-foreground/20 rounded-md w-[18px] h-[18px]"></div>
                    <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
                  </div>
                </td>
                <td className="p-2.5">
                  <div className="h-3 bg-muted-foreground/20 rounded w-4/5"></div>
                </td>
                {showModuleColumn && (
                  <td className="p-2.5">
                    <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
                  </td>
                )}
                <td className="p-2.5">
                  <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                </td>
                <td className="p-2.5">
                  <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
