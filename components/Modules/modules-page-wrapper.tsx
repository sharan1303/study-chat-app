"use client";

import { useSearchParams } from "next/navigation";
import ModulesPageContent from "./modules-content";

/**
 * Wrapper component that gets search params and passes them to ModulesPageContent.
 * This eliminates the pattern of passing a function as children which was causing the error.
 */
export default function ModulesPageWrapper() {
  const searchParams = useSearchParams();
  return <ModulesPageContent searchParams={searchParams} />;
}
