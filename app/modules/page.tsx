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
  // This small delay ensures the loading.tsx is displayed properly
  // It prevents the flash of blank content
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Get search query from URL parameters - convert to undefined if null/empty
  // Await the searchParams to fix the "searchParams should be awaited" error
  const params = await Promise.resolve(searchParams);
  const searchQueryRaw = params.query;
  const searchQuery =
    typeof searchQueryRaw === "string" && searchQueryRaw.trim() !== ""
      ? searchQueryRaw
      : undefined;

  // Fetch modules data server-side
  const modulesData = await serverApi.getModules(searchQuery);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <ModulesPageWrapper
        prefetchedModules={modulesData.modules || []}
        searchParams={params}
      />
    </div>
  );
}

// This tells Next.js to always render the page dynamically
// which helps trigger the loading state properly
export const dynamic = "force-dynamic";
