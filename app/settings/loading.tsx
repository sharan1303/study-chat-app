import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function SettingsLoading() {
  return (
    <div className="h-full flex flex-col py-2.5">
      {/* Top navigation bar */}
      <div className="flex justify-between items-center pr-6">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center opacity-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
        <Skeleton className="h-9 w-[70px]" />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col p-6 md:flex-row gap-8 max-w-6xl mx-auto">
          {/* Left sidebar with user info */}
          <div className="w-full md:w-1/3">
            <div className="flex flex-col items-center text-center mb-6">
              <Skeleton className="w-32 h-32 rounded-full mb-4" />
              <Skeleton className="h-6 w-60 mb-2" />
              <Skeleton className="h-5 w-60 mb-2" />
              <Badge variant="secondary" className="pt-1 opacity-50">
                Free Plan
              </Badge>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-5 w-32" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2].map((i) => (
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
          <div className="flex-1">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                {[
                  "Account",
                  "Customization",
                  "History & Sync",
                  "Models"
                ].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase()}
                    className="opacity-50"
                    disabled
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-6 w-12" />
                      </div>
                      {i !== 3 && <div className="h-px bg-border opacity-50" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
