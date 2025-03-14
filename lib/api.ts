import { Module } from "./store";

/**
 * Fetches the user's modules from the server
 */
export async function fetchModules(): Promise<Module[]> {
  try {
    const response = await fetch("/api/modules");

    if (!response.ok) {
      throw new Error("Failed to fetch modules");
    }

    const data = await response.json();
    return data.modules;
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
