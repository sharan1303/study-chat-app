import { Loader2 } from "lucide-react";

export default function SettingsLoading() {
  return (
    <div className="container mx-auto py-10 flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    </div>
  );
}
