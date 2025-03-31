"use client";

import { useSearchParams } from "next/navigation";

// This component will be properly wrapped in Suspense
export function SearchParamsReader({
  children,
}: {
  children: (params: URLSearchParams) => React.ReactNode;
}) {
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}
