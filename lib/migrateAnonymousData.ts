/**
 * Utility functions for migrating anonymous user data to authenticated user accounts
 */
import { getOrCreateSessionId } from "./anonymousSession";

/**
 * Migrates anonymous data to a user's account
 *
 * @param userId The ID of the user to migrate data to
 * @returns A boolean indicating if the migration was successful
 */
export async function migrateAnonymousData(userId: string): Promise<boolean> {
  try {
    // Get the anonymous session ID
    const sessionId = localStorage.getItem("anonymous_session_id");

    if (!sessionId) {
      return false;
    }

    // Call the API to migrate the data
    const response = await fetch("/api/migrate-anonymous-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        userId,
      }),
    });

    if (!response.ok) {
      return false;
    }

    // Clear the anonymous session ID
    localStorage.removeItem("anonymous_session_id");

    return true;
  } catch (error) {
    console.error("Error migrating anonymous data:", error);
    return false;
  }
}

/**
 * Check if there is any anonymous data that can be migrated
 * @returns Promise that resolves to a boolean indicating if migration is possible
 */
export async function hasAnonymousData(): Promise<boolean> {
  try {
    const sessionId = getOrCreateSessionId();

    if (!sessionId) {
      return false;
    }

    // Check if there's any data for this session
    const response = await fetch(
      `/api/check-anonymous-data?sessionId=${sessionId}`
    );

    if (!response.ok) {
      throw new Error("Failed to check anonymous data");
    }

    const data = await response.json();
    return data.hasData;
  } catch (error) {
    console.error("Error checking anonymous data:", error);
    return false;
  }
}
