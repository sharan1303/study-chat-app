import ModulesPageWrapper from "@/components/Modules/modules-main-wrapper";

/**
 * Renders the modules page with search parameters handling.
 *
 * This server component forces a short delay to ensure the loading state is properly displayed.
 * It then renders the client component which handles the actual data fetching and UI.
 *
 * @returns A React element representing the complete modules page with dynamic content.
 */
export default async function ModulesPage() {
  // This artificial delay ensures that the loading.tsx is displayed
  // when navigating to this page
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return (
    <div className="flex min-h-screen w-full flex-col">
      <ModulesPageWrapper />
    </div>
  );
}

// This tells Next.js to always render the page dynamically
// which helps trigger the loading state properly
export const dynamic = "force-dynamic";
