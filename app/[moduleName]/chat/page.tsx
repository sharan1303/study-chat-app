"use client";

import { Suspense, useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { generateId, decodeModuleSlug } from "@/lib/utils";
import ClientChatPage from "@/app/ClientChatPage";
import { ChatPageLoading } from "@/app/ClientChatPage";

export default function NewModuleChat() {
  const { moduleName } = useParams() as { moduleName: string };
  const { isSignedIn, user } = useUser();
  const [moduleData, setModuleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get the module name from the URL path
  const decodedModuleName = decodeModuleSlug(moduleName);

  // Generate a new chat ID
  const chatId = generateId();

  useEffect(() => {
    async function fetchModuleData() {
      try {
        setIsLoading(true);

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

              if (modules.length > 0) {
                const formattedModule = {
                  ...modules[0],
                  resources: modules[0].resources || [],
                };
                setModuleData(formattedModule);

                // Update lastStudied timestamp (silently)
                try {
                  fetch(
                    `/api/modules/${modules[0].id}?sessionId=${sessionId}`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        lastStudied: new Date().toISOString(),
                      }),
                    }
                  ).catch((e) =>
                    console.error("Error updating lastStudied:", e)
                  );
                } catch (error) {
                  console.error("Error updating lastStudied:", error);
                }

                setIsLoading(false);
                return;
              }
            }
          }

          // If no module found or no sessionId, we'll show a basic chat interface
          setModuleData(null);
          setIsLoading(false);
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

            if (modules.length > 0) {
              const formattedModule = {
                ...modules[0],
                resources: modules[0].resources || [],
              };
              setModuleData(formattedModule);

              // Update lastStudied timestamp (silently)
              try {
                fetch(`/api/modules/${modules[0].id}`, {
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
              } catch (error) {
                console.error("Error updating lastStudied:", error);
              }
            } else {
              // No module found
              notFound();
            }
          } else {
            // Error fetching module
            notFound();
          }
        }
      } catch (error) {
        console.error("Error loading module:", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    fetchModuleData();
  }, [decodedModuleName, isSignedIn, user]);

  if (isLoading) {
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
