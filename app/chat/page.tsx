"use client";

import { getModuleDetails } from "../actions";
import ClientChatPage from "../ClientChatPage";
import { Suspense } from "react";
import { ChatPageLoading } from "../ClientChatPage";
import { redirect } from "next/navigation";

// Legacy chat page that redirects to proper module URLs
export default async function ChatPage({
  searchParams,
}: {
  searchParams: { module?: string };
}) {
  // Check for legacy module param
  const moduleId = searchParams.module;

  if (moduleId) {
    // Fetch the module to get its name
    const moduleDetails = await getModuleDetails(moduleId);

    if (moduleDetails) {
      // Generate the proper URL path for this module
      const encodedName = encodeURIComponent(
        moduleDetails.name.toLowerCase().replace(/\s+/g, "-")
      );
      // Redirect to the new URL format (just the module name)
      redirect(`/${encodedName}`);
    }
  }

  // If no module or module not found, just show the default chat page
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ClientChatPage initialModuleDetails={null} />
    </Suspense>
  );
}
