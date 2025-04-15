import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ModuleDetailWrapper from "@/components/Modules/module-detail-page";
import { serverApi } from "@/lib/serverApi";
import { decodeModuleSlug } from "@/lib/utils";

type ModuleDetailPageProps = {
  params: Promise<{ moduleName: string }>;
};

/**
 * Server component for the module detail page.
 *
 * This component renders the ModuleDetailWrapper client component.
 * It prefetches module resources server-side to prevent UI flashing.
 */
export default async function ModuleDetailPage({
  params,
}: ModuleDetailPageProps) {
  // Await the params Promise to get the actual values
  const resolvedParams = await params;
  
  // Check authentication status
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  // Check if module name exists and is valid
  if (
    !resolvedParams ||
    !resolvedParams.moduleName ||
    typeof resolvedParams.moduleName !== "string" ||
    !resolvedParams.moduleName.trim()
  ) {
    console.error(
      "Module name is missing or invalid in server component:",
      resolvedParams
    );
    return notFound();
  }

  // Decode the module name from URL parameters
  const decodedModuleName = decodeModuleSlug(resolvedParams.moduleName);

  // Prefetch module data to find the module ID
  let moduleId = null;
  let prefetchedResources = [];

  try {
    // First try an exact match query - use serverApi instead of api
    const exactMatchData = await serverApi.getModules(decodedModuleName, true);
    const exactModules = exactMatchData.modules || [];

    if (exactModules.length > 0) {
      moduleId = exactModules[0].id;

      // Prefetch resources if authenticated
      if (isAuthenticated && moduleId) {
        const resourcesData = await serverApi.getModuleResourcesServer(
          moduleId
        );
        prefetchedResources = resourcesData.resources || [];
      } else {
        console.log(
          "Server: Not prefetching resources - user not authenticated or no moduleId"
        );
      }
    }
  } catch (error) {
    console.error("Error prefetching module data:", error);
  }

  return (
    <ModuleDetailWrapper
      moduleName={resolvedParams.moduleName}
      decodedModuleName={decodedModuleName}
      prefetchedResources={prefetchedResources}
    />
  );
}

// This tells Next.js to always render the page dynamically
// which helps trigger the loading state properly
export const dynamic = "force-dynamic";
