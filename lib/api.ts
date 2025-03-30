import { getOrCreateSessionIdClient } from "./session";

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
      throw new Error(`Failed to fetch modules: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new module
   */
  async createModule(data: {
    name: string;
    description?: string;
    icon?: string;
  }) {
    // Always ensure we have a session ID by using getOrCreate
    const sessionId = getOrCreateSessionIdClient();
    console.log("Client: Using session ID for createModule:", sessionId);

    // Add retry logic for session ID
    let retryCount = 0;
    while (!sessionId && retryCount < 3) {
      console.log(`Retrying to get session ID (attempt ${retryCount + 1})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newSessionId = getOrCreateSessionIdClient();
      if (newSessionId) {
        console.log("Successfully got session ID after retry");
        break;
      }
      retryCount++;
    }

    // Ensure we have a valid session ID
    if (!sessionId) {
      console.error(
        "No session ID available for module creation after retries"
      );
      throw new Error("Failed to get session ID");
    }

    const queryString = `?sessionId=${sessionId}`;
    console.log(`Client: Making request to /api/modules${queryString}`);

    try {
      const response = await fetch(`/api/modules${queryString}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "same-origin", // Add this to ensure cookies are sent
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from createModule:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          sessionId,
        });
        throw new Error(
          errorData.error || `Failed to create module: ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("Module created successfully:", responseData);
      return responseData;
    } catch (error) {
      console.error("Exception in createModule:", {
        error,
        sessionId,
        data,
      });
      throw error;
    }
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
