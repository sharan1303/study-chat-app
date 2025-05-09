import { getOrCreateSessionIdClient } from "./session";

/**
 * Chat history response interface
 */
export interface ChatHistoryResponse {
  chats: any[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

/**
 * API client for making requests to the backend
 * Automatically handles session IDs for anonymous users
 */
export const api = {
  /**
   * Get all modules
   */
  async getModules(name?: string, exactMatch?: boolean) {
    // Always ensure we have a session ID by using getOrCreate
    const sessionId = getOrCreateSessionIdClient();

    const params = new URLSearchParams();

    if (sessionId) {
      params.append("sessionId", sessionId);
    }

    if (name) {
      params.append("name", name);
    }

    if (exactMatch) {
      params.append("exactMatch", "true");
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";

    const response = await fetch(`/api/modules${queryString}`);

    if (!response.ok) {
      console.error(
        `Failed to fetch modules: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch modules: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get a specific module by ID
   */
  async getModule(moduleId: string) {
    const sessionId = getOrCreateSessionIdClient();

    const params = new URLSearchParams();
    if (sessionId) {
      params.append("sessionId", sessionId);
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/modules/${moduleId}${queryString}`);

    if (!response.ok) {
      console.error(
        `Failed to fetch module: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch module: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get all resources for a module
   */
  async getModuleResources(moduleId: string) {
    const sessionId = getOrCreateSessionIdClient();

    const params = new URLSearchParams();
    if (sessionId) {
      params.append("sessionId", sessionId);
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(
      `/api/modules/${moduleId}/resources${queryString}`
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch resources: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch resources: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new module
   */
  async createModule(data: { name: string; context?: string; icon?: string }) {
    const sessionId = getOrCreateSessionIdClient();

    const params = new URLSearchParams();
    if (sessionId) {
      params.append("sessionId", sessionId);
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/modules${queryString}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(
        `Failed to create module: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to create module: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Chat history response interface
   */
  async getChatHistory(options?: {
    limit?: number;
    cursor?: string;
  }): Promise<ChatHistoryResponse> {
    const sessionId = getOrCreateSessionIdClient();

    const params = new URLSearchParams();
    if (sessionId) {
      params.append("sessionId", sessionId);
    }

    // Add pagination parameters if provided
    if (options?.limit) {
      params.append("limit", options.limit.toString());
    }

    if (options?.cursor) {
      params.append("cursor", options.cursor);
    }

    // Add a timestamp to avoid caching
    params.append("t", Date.now().toString());

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/chat/history${queryString}`);

    if (!response.ok) {
      console.error(
        `Failed to fetch chat history: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch chat history: ${response.statusText}`);
    }

    // Get the response JSON
    const data = await response.json();

    // Handle backward compatibility with old API format
    if (Array.isArray(data)) {
      return {
        chats: data,
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      };
    }

    return data;
  },

  /**
   * Get resources for a module
   */
  async getResources(moduleId: string) {
    // Resources are only available to authenticated users
    // No sessionId support for resources

    try {
      const response = await fetch(`/api/modules/${moduleId}/resources`);

      if (response.status === 401) {
        // Handle unauthorized gracefully - user is not logged in
        console.log("User is not authenticated for resources");
        return { resources: [] };
      } else if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.statusText}`);
      }

      // Parse the JSON response
      const data = await response.json();

      // If the response has a resources property, return that
      // Otherwise, return the data directly (for backwards compatibility)
      return data.resources ? data : { resources: [] };
    } catch (error) {
      console.error("Error fetching resources:", error);
      return { resources: [] };
    }
  },

  /**
   * Create a new resource for a module
   */
  async createResource(
    moduleId: string,
    data: { url?: string; title: string; content?: string; type?: string }
  ) {
    // Resources are only available to authenticated users
    // No sessionId support for resources

    const response = await fetch(`/api/modules/${moduleId}/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to create resource: ${response.statusText}`
      );
    }

    return response.json();
  },
};

/**
 * Fetch metadata for a URL to generate a link preview
 */
export async function fetchLinkPreview(url: string) {
  try {
    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort("Request timeout"),
      10000
    ); // Increased to 10 second timeout

    try {
      const response = await fetch(
        `/api/link-preview?url=${encodeURIComponent(url)}`,
        { signal: controller.signal }
      );

      // Clear the timeout as soon as the request completes
      clearTimeout(timeoutId);

      // Get the json regardless of status - our API now returns a valid response even for errors
      const data = await response.json();
      return data;
    } catch (fetchError) {
      // Clear timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Re-throw the error to be handled by the outer catch
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching link preview:", error);

    // Return a default object with basic information
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;

      return {
        success: false,
        url,
        title: hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      };
    } catch (parseError) {
      // Handle URL parsing errors
      return {
        success: false,
        url,
        title: url,
      };
    }
  }
}
