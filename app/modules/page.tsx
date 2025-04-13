import ModulesPageWrapper from "@/components/Modules/modules-main-wrapper";
import { serverApi } from "@/lib/serverApi";

/**
 * Renders the modules page with prefetched data to eliminate double loading.
 *
 * This server component fetches modules data server-side and passes it to the client component,
 * eliminating the need for the client to fetch the same data again.
 *
 * @returns A React element representing the complete modules page with dynamic content.
 */
export default async function ModulesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  console.log("Server: Fetching modules server-side");

  // This small delay ensures the loading.tsx is displayed properly
  // It prevents the flash of blank content
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Get search query from URL parameters - convert to undefined if null/empty
  const searchQueryRaw = searchParams.query;
  const searchQuery =
    typeof searchQueryRaw === "string" && searchQueryRaw.trim() !== ""
      ? searchQueryRaw
      : undefined;

  // Fetch modules data server-side
  const modulesData = await serverApi.getModules(searchQuery);

  console.log(`Server: Fetched ${modulesData.modules?.length || 0} modules`);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <ModulesPageWrapper
        prefetchedModules={modulesData.modules || []}
        searchParams={searchParams}
      />
    </div>
  );
}

// This tells Next.js to always render the page dynamically
// which helps trigger the loading state properly
export const dynamic = "force-dynamic";
