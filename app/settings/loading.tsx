import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="h-full flex flex-col py-3">
      {/* Top navigation bar */}
      <div className="flex justify-between items-center ml-5 pr-6">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center add-margin-for-headers p-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-[68px]" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto pt-2 px-6">
        <div className="flex flex-col py-5 md:flex-row gap-8 max-w-6xl mx-auto">
          {/* Left sidebar with user info */}
          <div className="w-full md:w-1/3">
            <div className="flex flex-col items-center text-center mb-6 mt-10">
              <Skeleton className="w-32 h-32 rounded-full mb-8 mt-1" />
              <Skeleton className="h-6 w-60 mb-2" />
              <Skeleton className="h-4 w-60 mb-3" />
              <Skeleton className="h-[22px] w-[75px] mb-0.5" />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Keyboard Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex gap-1">
                      <Skeleton className="h-6 w-6" />
                      <Skeleton className="h-6 w-6" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right side with settings tabs */}
          <div className="flex-1 py-1">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                {["Account", "Modules", "History & Sync", "Models"].map(
                  (tab) => (
                    <TabsTrigger key={tab} value={tab.toLowerCase()} disabled>
                      {tab}
                    </TabsTrigger>
                  )
                )}
              </TabsList>

              <Card>
                <CardContent className="space-y-6">
                  {/* Username input skeleton */}
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold pt-4">
                      What should Study Chat call you?
                    </h2>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-full" />
                    </div>
                  </div>

                  {/* Email addresses section */}
                  <div className="pt-4 border-t">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-medium">Email addresses</h3>
                    </div>
                    <div className="space-y-3">
                      {[1].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <Skeleton className="h-5 w-64" />
                        </div>
                      ))}
                      <Skeleton className="h-8 w-40 mt-2" />
                    </div>
                  </div>

                  {/* Connected accounts section */}
                  <div className="pt-[9px]">
                    <h3 className="mb-3 text-lg font-medium">
                      Connected accounts
                    </h3>
                    <div className="space-y-3">
                      {/* GitHub */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-5" />
                          <Skeleton className="h-5 w-12" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>

                      {/* Google */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-5" />
                          <Skeleton className="h-5 w-12" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-[9px]">
                    <div className="rounded-lg border border-destructive/50 bg-destructive/20 p-6">
                      <h3 className="text-2xl font-bold mb-2">Danger Zone</h3>
                      <p className="text-sm mb-4">
                        Permanently delete your account and all associated data.
                      </p>
                      <Skeleton className="bg-destructive h-9 w-40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
