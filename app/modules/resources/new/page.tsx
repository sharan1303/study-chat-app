"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResourceUploadRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams?.get("moduleId");

  useEffect(() => {
    // Redirect to modules page or the specific module page
    if (moduleId) {
      router.push(`/modules?openResourceUpload=true&moduleId=${moduleId}`);
    } else {
      router.push("/modules?openResourceUpload=true");
    }
  }, [router, moduleId]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting...</p>
    </div>
  );
}
