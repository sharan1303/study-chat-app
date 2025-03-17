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
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format a module name for use in URLs
 * Creates clean URIs by standardizing separators to hyphens
 * Maintains compatibility with existing routing
 */
export function encodeModuleSlug(moduleName: string): string {
  if (!moduleName) return "";

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

  return cleanedName;
}

/**
 * Decode a module slug from a URL back to a format that can be matched with database records
 * Focuses on matching the database record format rather than exact restoration
 */
export function decodeModuleSlug(encodedSlug: string): string {
  if (!encodedSlug) return "";

  // Step 1: Decode any URI components
  const decodedSlug = decodeURIComponent(encodedSlug);

  // Step 2: Replace hyphens with spaces for matching with database records
  return decodedSlug.replace(/-/g, " ");
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
