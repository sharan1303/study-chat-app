import ModuleDetailWrapper from "@/components/Modules/module-detail-page-wrapper";

/**
 * Server component for the module detail page.
 *
 * This component renders the ModuleDetailWrapper client component.
 */
export default async function ModuleDetailPage({
  params,
}: {
  params: { moduleName: string };
}) {
  return <ModuleDetailWrapper params={params} />;
}

// This tells Next.js to always render the page dynamically
// which helps trigger the loading state properly
export const dynamic = "force-dynamic";
