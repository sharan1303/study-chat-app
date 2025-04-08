import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  } else if (diffDays < 365 * 5) {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  } else {
    return "Older";
  }
}

/**
 * Format a module name for use in URLs
 * Creates clean URIs by standardizing separators to hyphens
 * Maintains compatibility with existing routing
 */
export function encodeModuleSlug(moduleName: string): string {
  if (!moduleName || typeof moduleName !== "string") {
    console.warn(
      "Invalid module name provided to encodeModuleSlug:",
      moduleName
    );
    return "unnamed-module"; // Return a default string instead of empty
  }

  // Step 1: Convert to lowercase for consistency
  const lowerCaseName = moduleName.toLowerCase();

  // Step 2: Replace whitespaces, underscores, commas, dots, slashes with hyphens
  let cleanedName = lowerCaseName.replace(/[\s_,.\\/]+/g, "-");

  // Step 3: Replace other common punctuation with empty string
  cleanedName = cleanedName.replace(/[?*()+=:%&#;!~'"@]+/g, "");

  // Step 4: Clean up the result - normalize hyphens and trim
  cleanedName = cleanedName
    .replace(/-+/g, "-") // Replace multiple consecutive hyphens with a single hyphen
    .replace(/^-|-$/g, ""); // Remove leading and trailing hyphens

  // If after cleaning we have empty string, use default
  if (!cleanedName) {
    console.warn(
      "Module name resulted in empty slug after cleaning:",
      moduleName
    );
    return "unnamed-module";
  }

  // Step 5: Add additional URL encoding to ensure it's properly handled by the router
  // Important: In Next.js dynamic routes, URI encoding can cause issues with route matching
  // So we need to be careful with what we encode and how
  return cleanedName; // Return the cleaned name without URI encoding to ensure route matching works
}

/**
 * Decode a module slug from a URL back to a format that can be matched with database records
 * Focuses on matching the database record format rather than exact restoration
 */
export function decodeModuleSlug(encodedSlug: string): string {
  if (!encodedSlug || typeof encodedSlug !== "string") {
    console.warn(
      "Invalid module slug received in decodeModuleSlug:",
      encodedSlug
    );
    return "unnamed-module"; // Return default value instead of empty string
  }

  try {
    // Log the original slug for debugging
    console.log(`Decoding slug: "${encodedSlug}"`);

    // Next.js already decodes the URL parameters, so we don't need to decode again
    // This avoids double-decoding issues that can corrupt the string
    const decodedSlug = encodedSlug;

    // Replace hyphens with spaces for matching with database records
    const result = decodedSlug.replace(/-/g, " ");

    // Ensure we don't return empty string
    const finalResult = result.trim() ? result.trim() : "unnamed-module";

    console.log(`Decoded result: "${finalResult}"`);
    return finalResult;
  } catch (error) {
    console.error("Error decoding module slug:", error, encodedSlug);
    // Fallback with basic hyphen replacement if decoding fails
    const fallbackResult = encodedSlug.replace(/-/g, " ");
    return fallbackResult.trim() ? fallbackResult.trim() : "unnamed-module";
  }
}

/**
 * Generate a unique ID for chats
 * @returns A unique string ID
 */
export function generateId(): string {
  // Generate a random string with timestamp to ensure uniqueness
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

/**
 * Format chat title from first message
 * @param message The first message content
 * @returns A formatted chat title
 */
export function formatChatTitle(message: string): string {
  if (!message) return "New Chat";

  const title = message.substring(0, 50);
  return title + (message.length > 50 ? "..." : "");
}

/**
 * Get the appropriate keyboard modifier key based on operating system
 * @returns The correct modifier key symbol/text for the current platform
 */
export function getModifierKey(): string {
  if (typeof navigator === "undefined") return "Ctrl/⌘"; // Default for SSR

  const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
  return isMac ? "⌘" : "Ctrl";
}
