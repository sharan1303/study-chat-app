import { Module } from "@/components/Sidebar";

/**
 * Fetches the user's modules from the server
 */
export async function fetchModules(): Promise<Module[]> {
  try {
    console.log("Fetching modules from API");

    const response = await fetch("/api/modules", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch modules: ${response.status} - ${errorText}`
      );
      throw new Error(`Failed to fetch modules: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "Raw API response:",
      JSON.stringify(data).substring(0, 200) + "..."
    );

    // Handle different response formats
    if (Array.isArray(data)) {
      console.log(`Found array data with ${data.length} modules`);
      return data;
    } else if (data && Array.isArray(data.modules)) {
      console.log(`Found modules property with ${data.modules.length} modules`);
      return data.modules;
    } else if (data && typeof data === "object") {
      // Try to find any array property as a fallback
      const arrayProps = Object.entries(data).find(([key, value]) => {
        if (Array.isArray(value)) {
          console.log(
            `Found array in property "${key}" with ${value.length} items`
          );
          return true;
        }
        return false;
      });

      if (arrayProps) {
        return arrayProps[1] as Module[];
      }

      // Check if we got a single module object and wrap it in an array
      if (data.id && data.name) {
        console.log("Found single module object, wrapping in array");
        return [data as Module];
      }
    }

    console.error("Unexpected API response format:", data);
    return [];
  } catch (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
}

/**
 * Updates a module's lastStudied timestamp
 */
export async function updateModuleLastStudied(
  moduleId: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/modules/${moduleId}/study`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to update module");
    }

    return true;
  } catch (error) {
    console.error("Error updating module:", error);
    return false;
  }
}
