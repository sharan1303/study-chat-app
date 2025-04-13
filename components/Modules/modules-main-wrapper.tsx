"use client";

import { useSearchParams } from "next/navigation";
import ModulesPageContent from "./modules-main-content";

// Define Module interface
interface Module {
  id: string;
  name: string;
  context: string | null;
  icon: string;
  resourceCount: number;
  updatedAt: string;
}

interface ModulesPageWrapperProps {
  prefetchedModules?: Module[];
  searchParams?: { [key: string]: string | string[] | undefined };
}

/**
 * Wrapper component that handles client-side functionality for the modules page.
 * It takes prefetched modules from the server component and passes them to ModulesPageContent.
 *
 * @param prefetchedModules - Array of modules prefetched on the server
 * @param searchParams - Search parameters from the URL
 */
export default function ModulesPageWrapper({
  prefetchedModules = [],
  searchParams = {},
}: ModulesPageWrapperProps) {
  // Get search params from the URL for client-side navigation
  const clientSearchParams = useSearchParams();

  // Convert server-provided searchParams to URLSearchParams for the content component
  const combinedSearchParams = new URLSearchParams();

  // Add params from server (for initial load)
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      combinedSearchParams.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => {
        combinedSearchParams.append(key, v);
      });
    }
  });

  // If clientSearchParams exists (during client navigation), prioritize those
  if (clientSearchParams) {
    clientSearchParams.forEach((value, key) => {
      combinedSearchParams.set(key, value);
    });
  }

  return (
    <ModulesPageContent
      prefetchedModules={prefetchedModules}
      searchParams={combinedSearchParams}
    />
  );
}
