import { getOrCreateSessionIdClient } from "./session";

/**
 * API client for making requests to the backend
 * Automatically handles session IDs for anonymous users
 */
export const api = {
  /**
   * Get all modules
   */
  async getModules(name?: string) {
    // Always ensure we have a session ID by using getOrCreate
    const sessionId = getOrCreateSessionIdClient();

    const params = new URLSearchParams();

    if (sessionId) {
      params.append("sessionId", sessionId);
    }

    if (name) {
      params.append("name", name);
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

    const queryString = sessionId ? `?sessionId=${sessionId}` : "";
    console.log(`Client: Making request to /api/modules${queryString}`);

    const response = await fetch(`/api/modules${queryString}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to create module: ${response.statusText}`
      );
    }

    return response.json();
  },

  /**
   * Get resources for a module
   */
  async getResources(moduleId: string) {
    // Always ensure we have a session ID by using getOrCreate
    const sessionId = getOrCreateSessionIdClient();
    console.log("Client: Using session ID for getResources:", sessionId);

    const queryString = sessionId ? `?sessionId=${sessionId}` : "";
    console.log(
      `Client: Making request to /api/modules/${moduleId}/resources${queryString}`
    );

    const response = await fetch(
      `/api/modules/${moduleId}/resources${queryString}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new resource for a module
   */
  async createResource(
    moduleId: string,
    data: { url?: string; title: string; content?: string; type?: string }
  ) {
    // Always ensure we have a session ID by using getOrCreate
    const sessionId = getOrCreateSessionIdClient();
    console.log("Client: Using session ID for createResource:", sessionId);

    const queryString = sessionId ? `?sessionId=${sessionId}` : "";
    console.log(
      `Client: Making request to /api/modules/${moduleId}/resources${queryString}`
    );

    const response = await fetch(
      `/api/modules/${moduleId}/resources${queryString}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed to create resource: ${response.statusText}`
      );
    }

    return response.json();
  },
};
