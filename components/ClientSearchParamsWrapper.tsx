"use client";

import { useSearchParams } from "next/navigation";
import { ReactNode } from "react";

interface ClientSearchParamsWrapperProps {
  children: (searchParams: URLSearchParams | null) => ReactNode;
}

/**
 * A client component wrapper that safely provides search parameters to its children
 * Use this component to avoid useSearchParams() errors in static generation
 */
export default function ClientSearchParamsWrapper({
  children,
}: ClientSearchParamsWrapperProps) {
  const searchParams = useSearchParams();

  return <>{children(searchParams)}</>;
}
