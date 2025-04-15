import { auth } from "@clerk/nextjs/server";

/**
 * Server-side API functions
 * These can only be used in Server Components or API routes
 */
export const serverApi = {
  /**
   * Get modules (server-side version)
   * Only to be used in server components
   */
  async getModules(name?: string, exactMatch?: boolean) {
    try {
      // Check if user is authenticated
      const { userId } = await auth();

      const params = new URLSearchParams();

      // If authenticated, use userId
      if (userId) {
        params.append("userId", userId);
      }

      if (name) {
        params.append("name", name);
      }

      if (exactMatch) {
        params.append("exactMatch", "true");
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";

      // Ensure we have a valid base URL for server-side requests
      const baseUrl =
        process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || "http://localhost:3000";
      const fullUrl = `${baseUrl}/api/modules${queryString}`;

      const response = await fetch(fullUrl, { cache: "no-store" });

      if (!response.ok) {
        console.error(
          `Failed to fetch modules server-side: ${response.status} ${response.statusText}`
        );
        return { modules: [] };
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching modules server-side:", error);
      return { modules: [] };
    }
  },

  /**
   * Get all resources for a module (server-side version)
   * Only to be used in server components
   */
  async getModuleResourcesServer(moduleId: string) {
    try {
      // Check if user is authenticated
      const { userId } = await auth();

      // Don't proceed if user is not authenticated
      if (!userId) {
        console.log("Server: User not authenticated for resources");
        return { resources: [] };
      }

      const params = new URLSearchParams();

      // Always use userId for authenticated users
      params.append("userId", userId);

      const queryString = params.toString() ? `?${params.toString()}` : "";

      // Ensure we have a valid base URL for server-side requests
      const baseUrl =
        process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || "http://localhost:3000";
      const fullUrl = `${baseUrl}/api/modules/${moduleId}/resources${queryString}`;

      const response = await fetch(fullUrl, { cache: "no-store" });

      if (!response.ok) {
        console.error(
          `Failed to fetch resources server-side: ${response.status} ${response.statusText}`
        );
        return { resources: [] };
      }

      const data = await response.json();
      console.log(
        `Server: Successfully fetched resources for module ${moduleId}`
      );
      return data;
    } catch (error) {
      console.error("Error fetching resources server-side:", error);
      return { resources: [] };
    }
  },
};
