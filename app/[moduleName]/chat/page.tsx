"use client";

import { useEffect, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { generateId, decodeModuleSlug } from "@/lib/utils";
import ChatPage from "@/components/Chat/ChatPage";
import { ChatPageLoading } from "@/components/Chat/ChatPageLoading";
import { useMemo } from "react";
import { Message } from "@ai-sdk/react";
import { createModuleWelcomeMessage } from "@/lib/prompts";
import { ModuleWithResources } from "@/lib/actions";

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
  context: string | null;
  icon: string;
  createdAt: string;
  updatedAt: string;
  lastStudied: string | null;
  resources: Resource[];
}

export default function NewModuleChat() {
  const { moduleName } = useParams() as { moduleName: string };
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [moduleData, setModuleData] = useState<ModuleWithResources | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  // Add a state to track if we've shown loading state at least once
  const [hasShownLoading, setHasShownLoading] = useState(false);

  // Get the module name from the URL path
  const decodedModuleName = decodeModuleSlug(moduleName);

  // Generate a new chat ID - use useMemo to prevent regeneration on re-renders
  const chatId = useMemo(() => generateId(), []);

  // Create an initial welcome message
  const welcomeMessage = useMemo<Message>(
    () => createModuleWelcomeMessage(moduleData?.name || decodedModuleName),
    [moduleData, decodedModuleName]
  );

  // Use useState for isNewChat to ensure SSR compatibility
  const [isNewChat, setIsNewChat] = useState(true);

  // Update isNewChat on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsNewChat(window.location.pathname.endsWith(`/${moduleName}/chat`));
    }
  }, [moduleName]);

  // Pre-emptively prepare the proper route to avoid 404s
  useEffect(() => {
    // Ensure the router knows about this chat ID
    if (isSignedIn && moduleData && chatId) {
      // Pre-fetch the chat route to ensure it's available
      router.prefetch(`/${moduleName}/chat/${chatId}`);
    }
  }, [isSignedIn, moduleData, chatId, moduleName, router]);

  useEffect(() => {
    let isMounted = true; // Track component mount state

    console.log("Fetching module data for:", decodedModuleName); // Debug log

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
              `/api/modules?name=${encodeURIComponent(
                decodedModuleName
              )}&sessionId=${sessionId}`
            );

            if (response.ok) {
              const data = await response.json();
              const modules = data.modules || [];

              if (modules.length > 0 && isMounted) {
                const formattedModule = {
                  ...modules[0],
                  resources: modules[0].resources || [],
                };
                console.log("Found module data:", formattedModule); // Debug log
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
            // Create a minimal module data object with just the name from the URL
            const fallbackModule: ModuleWithResources = {
              id: "temp-module-id",
              name: decodedModuleName,
              context: null,
              icon: "📚",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastStudied: null,
              resources: [],
            };
            console.log("No module found, using fallback:", fallbackModule); // Debug log
            setModuleData(fallbackModule);
            setIsLoading(false);
          }
          return;
        }

        // For authenticated users
        const userId = user?.id;

        if (userId) {
          // Fetch the module with more precise query

          try {
            // First try an exact match query (case insensitive)
            const exactMatchResponse = await fetch(
              `/api/modules?name=${encodeURIComponent(
                decodedModuleName
              )}&exactMatch=true`
            );

            if (exactMatchResponse.ok) {
              const data = await exactMatchResponse.json();
              const modules = data.modules || [];

              if (modules.length > 0 && isMounted) {
                const formattedModule = {
                  ...modules[0],
                  resources: modules[0].resources || [],
                };
                console.log(
                  "Found module data (exact match):",
                  formattedModule
                ); // Debug log
                setModuleData(formattedModule);
                setIsLoading(false);

                // Update lastStudied timestamp (silently)
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

                return;
              }
            }

            // If no exact match, try a fuzzy match query
            const response = await fetch(
              `/api/modules?name=${encodeURIComponent(decodedModuleName)}`
            );

            if (response.ok) {
              const data = await response.json();
              const modules = data.modules || [];

              if (modules.length > 0 && isMounted) {
                const formattedModule = {
                  ...modules[0],
                  resources: modules[0].resources || [],
                };
                console.log(
                  "Found module data (fuzzy match):",
                  formattedModule
                ); // Debug log
                setModuleData(formattedModule);
                setIsLoading(false);

                // Update lastStudied timestamp (silently)
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
              } else if (isMounted) {
                // Create a minimal module data object with just the name from the URL
                const fallbackModule: ModuleWithResources = {
                  id: "temp-module-id",
                  name: decodedModuleName,
                  context: null,
                  icon: "📚",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  lastStudied: null,
                  resources: [],
                };
                console.log("No module found, using fallback:", fallbackModule); // Debug log
                setModuleData(fallbackModule);
                setIsLoading(false);
              }
            } else if (isMounted) {
              // Create a minimal module data object with just the name from the URL
              const fallbackModule: ModuleWithResources = {
                id: "temp-module-id",
                name: decodedModuleName,
                context: null,
                icon: "📚",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastStudied: null,
                resources: [],
              };
              console.log("API error, using fallback:", fallbackModule); // Debug log
              setModuleData(fallbackModule);
              setIsLoading(false);
            }
          } catch (error) {
            console.error("Error loading module:", error);
            if (isMounted) {
              // Create a minimal module data object with just the name from the URL
              const fallbackModule: ModuleWithResources = {
                id: "temp-module-id",
                name: decodedModuleName,
                context: null,
                icon: "📚",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastStudied: null,
                resources: [],
              };
              console.log("Error caught, using fallback:", fallbackModule); // Debug log
              setModuleData(fallbackModule);
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Error loading module:", error);
        if (isMounted) {
          // Create a minimal module data object with just the name from the URL
          const fallbackModule: ModuleWithResources = {
            id: "temp-module-id",
            name: decodedModuleName,
            context: null,
            icon: "📚",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastStudied: null,
            resources: [],
          };
          console.log("Outer error catch, using fallback:", fallbackModule); // Debug log
          setModuleData(fallbackModule);
          setIsLoading(false);
        }
      }
    }

    fetchModuleData();

    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
      clearTimeout(minLoadingTimer); // Clear the minimum loading timer
    };
  }, [decodedModuleName, isSignedIn, user]);

  // Cleanup the loading state once we have module data
  useEffect(() => {
    if (!isLoading && moduleData) {
      setHasShownLoading(true);
    }
  }, [isLoading, moduleData]);

  // Debug log moduleData changes
  useEffect(() => {
    console.log("moduleData changed:", moduleData);
  }, [moduleData]);

  // Create fallback module data immediately to ensure we have data for rendering
  useEffect(() => {
    // If no module data is loaded yet, create a minimal fallback with the name from URL
    if (!moduleData && !isLoading) {
      const fallbackModule: ModuleWithResources = {
        id: "temp-module-id",
        name: decodedModuleName,
        context: null,
        icon: "📚",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastStudied: null,
        resources: [],
      };
      setModuleData(fallbackModule);
    }
  }, [moduleData, isLoading, decodedModuleName]);

  // Minimum loading time to prevent flicker
  if (isLoading && !hasShownLoading) {
    return <ChatPageLoading />;
  }

  // Ensure we always have module data
  if (!moduleData) {
    return <ChatPageLoading />;
  }


  return (
    <ChatPage
      initialModuleDetails={moduleData}
      chatId={chatId}
      initialMessages={[welcomeMessage]}
      isAuthenticated={isSignedIn}
      isNewChat={isNewChat}
    />
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
