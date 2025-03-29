import { useState, useCallback } from "react";

/**
 * Custom React hook to manage and regenerate a resource URL.
 *
 * This hook tracks the current resource URL while monitoring the regeneration process and capturing any related errors.
 * It provides an asynchronous function that sends a request to regenerate the URL. If token-related issues are encountered,
 * the regeneration function automatically retries up to two times with a short delay between attempts.
 *
 * @param resourceId - The ID of the resource. Regeneration is skipped if not provided.
 * @param initialUrl - The initial URL of the resource.
 * @returns An object containing:
 *   - url: The current resource URL.
 *   - isLoading: A flag indicating whether regeneration is in progress.
 *   - error: An error message if URL regeneration fails, or null.
 *   - regenerateUrl: An asynchronous function that triggers URL regeneration, returning the new URL on success or null on failure.
 */
export function useResourceUrl(resourceId: string, initialUrl: string) {
  // Store the actual URL we're using, separate from the initialUrl prop
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Function to regenerate the URL
  const regenerateUrl = useCallback(async (): Promise<string | null> => {
    console.log("🚀 regenerateUrl FUNCTION CALLED - START OF FUNCTION");

    if (!resourceId) {
      console.log("⚠️ Cannot regenerate URL: No resource ID provided");
      return null;
    }

    console.log("🔄 Starting URL regeneration - Resource ID:", resourceId);
    console.log("🔍 Current URL:", initialUrl);

    setIsLoading(true);
    setError(null);

    try {
      console.log("📤 Sending regeneration request to API");

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("⏱️ Request timeout - Aborting");
        controller.abort();
      }, 15000); // 15 second timeout

      const response = await fetch("/api/resources/regenerateUrl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId,
          // Add a random string to prevent caching
          _: Math.random().toString(36).substring(2),
        }),
        signal: controller.signal,
        // Disable request caching
        cache: "no-cache",
      });

      clearTimeout(timeoutId);
      console.log("📥 Received response - Status:", response.status);

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          console.error("❌ Error response data:", errorData);
          errorMessage = errorData.error || errorMessage;

          // If this is a JWT error, display a more helpful message
          if (
            errorMessage.includes("JWT") ||
            errorMessage.includes("expired") ||
            errorMessage.includes("token")
          ) {
            errorMessage = "Access token expired. Retrying...";

            // Retry logic
            if (retryCount < 2) {
              console.log(
                `⏱️ Retry attempt ${retryCount + 1} - Waiting 1 second...`
              );
              setRetryCount((prev) => prev + 1);

              // Wait a second and try again
              await new Promise((resolve) => setTimeout(resolve, 1000));
              // Explicit type annotation here
              return await regenerateUrl();
            }
          }
        } catch (parseError) {
          console.error(
            "❌ Could not parse error response as JSON",
            parseError
          );
        }

        throw new Error(errorMessage);
      }

      // Reset retry count on success
      if (retryCount > 0) {
        setRetryCount(0);
      }

      // Parse the response JSON
      console.log("🔄 Parsing response body");
      const data = await response.json();
      console.log("📋 Response data:", data);

      if (!data.url) {
        console.error("❌ No URL returned in response");
        throw new Error("No URL returned from server");
      }

      // Update the URL state
      console.log("✅ Setting new URL:", data.url);
      setUrl(data.url);

      return data.url;
    } catch (err) {
      console.error("❌ Error regenerating URL:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return null;
    } finally {
      setIsLoading(false);
      console.log("🔄 Regeneration process completed");
    }
  }, [resourceId, initialUrl, retryCount]);

  return {
    url,
    isLoading,
    error,
    regenerateUrl,
  };
}
