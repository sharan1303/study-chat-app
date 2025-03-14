import { Module } from "./store";

/**
 * Fetches the user's modules from the server
 */
export async function fetchModules(): Promise<Module[]> {
  try {
    const response = await fetch("/api/modules", {
      headers: {
        "Cache-Control": "no-store",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch modules");
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.modules)) {
      return data.modules;
    } else if (data && typeof data === "object") {
      // Try to find any array property as a fallback
      const arrayProps = Object.entries(data).find(([, value]) =>
        Array.isArray(value)
      );

      if (arrayProps) {
        return arrayProps[1] as Module[];
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
