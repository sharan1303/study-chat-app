export default function SidebarSkeleton() {
  return (
    <div className="w-64 flex flex-col h-screen bg-background border-r animate-pulse">
      {/* Header skeleton */}
      <div className="p-4 flex items-center justify-between border-b">
        <div className="h-6 w-24 bg-muted rounded"></div>
        <div className="h-8 w-8 bg-muted rounded"></div>
      </div>

      {/* Modules section skeleton */}
      <div className="flex-1">
        <div className="p-4 flex items-center justify-between">
          <div className="h-9 w-28 bg-muted rounded"></div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </div>

        <div className="p-4 pt-0 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded"></div>
          ))}
        </div>
      </div>

      {/* User section skeleton */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="h-8 w-28 bg-muted rounded"></div>
          <div className="h-8 w-8 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  );
}
