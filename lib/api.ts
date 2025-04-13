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

    // Debug: Log session ID
    console.log("API getModules using sessionId:", sessionId);

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
    console.log("API getModule using sessionId:", sessionId);

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
    console.log("API getModuleResources using sessionId:", sessionId);

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
  async createModule(data: {
    name: string;
    context?: string;
    icon?: string;
  }) {
    const sessionId = getOrCreateSessionIdClient();
    console.log("API createModule using sessionId:", sessionId);

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
   * Get chat history
   */
  async getChatHistory() {
    const sessionId = getOrCreateSessionIdClient();
    console.log("API getChatHistory using sessionId:", sessionId);

    const params = new URLSearchParams();
    if (sessionId) {
      params.append("sessionId", sessionId);
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

    // Get the response as JSON - this returns an array directly
    const data = await response.json();
    console.log(`API client received chats:`, data.length || 0);

    // Return the data directly as it's already in the right format (array of chats)
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
