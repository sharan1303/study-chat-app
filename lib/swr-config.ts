import { SWRConfiguration } from "swr";

// Standard fetcher function for SWR
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object
    (error as unknown as { info: unknown }).info = await res.json();
    (error as unknown as { status: number }).status = res.status;
    throw error;
  }
  return res.json();
};

// Global SWR configuration for better performance
export const swrConfig: SWRConfiguration = {
  // Disable revalidation on focus for better performance
  revalidateOnFocus: false,

  // Don't revalidate on reconnect to reduce requests
  revalidateOnReconnect: false,

  // Changed to true to ensure stale data is updated
  revalidateIfStale: true,

  // Reduced to 5 seconds for more frequent updates
  dedupingInterval: 5000,

  // Keep data fresh in cache for 1 minute
  // This helps prevent multiple refetches during navigations
  focusThrottleInterval: 60000,

  // Enable suspense mode for concurrent rendering
  suspense: true,

  // Add error retry logic
  errorRetryCount: 3,
  errorRetryInterval: 5000,

  // Use localStorage for SWR cache to persist between refreshes
  provider: (cache) => {
    // Initialize with current values
    if (typeof window !== "undefined") {
      try {
        const localData = localStorage.getItem("swr-cache");
        if (localData) {
          const data = JSON.parse(localData);
          Object.keys(data).forEach((key) => {
            cache.set(key, data[key]);
          });
        }

        // Save cache to localStorage when window is about to unload
        window.addEventListener("beforeunload", () => {
          const cacheData: Record<string, unknown> = {};
          Array.from(cache.keys()).forEach((key) => {
            cacheData[key] = cache.get(key);
          });
          localStorage.setItem("swr-cache", JSON.stringify(cacheData));
        });
      } catch (error) {
        console.error("Failed to restore SWR cache from localStorage", error);
      }
    }

    return cache;
  },
};
