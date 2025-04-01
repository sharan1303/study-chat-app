import { notFound } from "next/navigation";
import ModuleDetailWrapper from "@/components/Modules/module-detail-page-wrapper";

type ModuleDetailPageProps = {
  params: Promise<{ moduleName: string }>;
};

/**
 * Server component for the module detail page.
 *
 * This component renders the ModuleDetailWrapper client component.
 */
export default async function ModuleDetailPage({
  params,
}: ModuleDetailPageProps) {
  // Await the params Promise to get the actual values
  const resolvedParams = await params;

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

  // Log the module name being passed to the client component
  console.log(
    `Server: Passing moduleName: "${resolvedParams.moduleName}" to client component`
  );

  return <ModuleDetailWrapper moduleName={resolvedParams.moduleName} />;
}

// This tells Next.js to always render the page dynamically
// which helps trigger the loading state properly
export const dynamic = "force-dynamic";
