"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { generateId, decodeModuleSlug } from "@/lib/utils";
import ClientChatPage from "@/app/ClientChatPage";
import { ChatPageLoading } from "@/app/ClientChatPage";
import { useMemo } from "react";

// Define a type for the module data
interface Resource {
  id: string;
  title: string;
  type: string;
  content: string;
  fileUrl: string | null;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

interface ModuleData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  createdAt: string;
  updatedAt: string;
  lastStudied: string | null;
  resources: Resource[];
}

export default function NewModuleChat() {
  const { moduleName } = useParams() as { moduleName: string };
  const { isSignedIn, user } = useUser();
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Add a state to track if we've shown loading state at least once
  const [hasShownLoading, setHasShownLoading] = useState(false);

  // Get the module name from the URL path
  const decodedModuleName = decodeModuleSlug(moduleName);

  // Generate a new chat ID - use useMemo to prevent regeneration on re-renders
  const chatId = useMemo(() => generateId(), []);

  useEffect(() => {
    let isMounted = true; // Track component mount state

    // Set a timeout to show loading state for at least 300ms to prevent flashes
    const minLoadingTimer = setTimeout(() => {
      if (isMounted) {
        setHasShownLoading(true);
      }
    }, 300);

    async function fetchModuleData() {
      try {
        if (!isSignedIn) {
          // For anonymous users, get sessionId from localStorage
          const sessionId = localStorage.getItem("anonymous_session_id");

          if (sessionId) {
            // Try to find module by session ID
            const response = await fetch(
              `/api/modules?name=${decodedModuleName}&sessionId=${sessionId}`
            );

            if (response.ok) {
              const data = await response.json();
              const modules = data.modules || [];

              if (modules.length > 0 && isMounted) {
                const formattedModule = {
                  ...modules[0],
                  resources: modules[0].resources || [],
                };
                setModuleData(formattedModule);
                setIsLoading(false);

                // Update lastStudied timestamp (silently) - don't await this
                fetch(`/api/modules/${modules[0].id}?sessionId=${sessionId}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    lastStudied: new Date().toISOString(),
                  }),
                }).catch((e) =>
                  console.error("Error updating lastStudied:", e)
                );

                return;
              }
            }
          }

          // If no module found or no sessionId, we'll show a basic chat interface
          if (isMounted) {
            setModuleData(null);
            setIsLoading(false);
          }
          return;
        }

        // For authenticated users
        const userId = user?.id;

        if (userId) {
          // Fetch the module
          const response = await fetch(
            `/api/modules?name=${decodedModuleName}`
          );

          if (response.ok) {
            const data = await response.json();
            const modules = data.modules || [];

            if (modules.length > 0 && isMounted) {
              const formattedModule = {
                ...modules[0],
                resources: modules[0].resources || [],
              };
              setModuleData(formattedModule);
              setIsLoading(false);

              // Update lastStudied timestamp (silently) - don't await this
              fetch(`/api/modules/${modules[0].id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  lastStudied: new Date().toISOString(),
                }),
              }).catch((e) => console.error("Error updating lastStudied:", e));
            } else if (isMounted) {
              // No module found
              notFound();
            }
          } else if (isMounted) {
            // Error fetching module
            notFound();
          }
        }
      } catch (error) {
        console.error("Error loading module:", error);
        if (isMounted) {
          notFound();
        }
      }
    }

    fetchModuleData();

    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
      clearTimeout(minLoadingTimer); // Clear the minimum loading timer
    };
  }, [decodedModuleName, isSignedIn, user]);

  // Only render the ClientChatPage after loading is complete and we've shown the loading state
  // This prevents flashes from quick loading
  if (isLoading || !hasShownLoading) {
    return <ChatPageLoading />;
  }

  return (
    <ClientChatPage
      initialModuleDetails={moduleData}
      chatId={chatId}
      initialMessages={[]}
      isAuthenticated={!!isSignedIn}
    />
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
