import { SESSION_ID_KEY } from "./session";

/**
 * For server-side handling, we'll need to rely on the session ID
 * being passed from the client via query parameters or the request body
 */
export function getSessionIdFromRequest(
  request: Request | URLSearchParams
): string | null {
  if (request instanceof Request) {
    // If it's a Request object, check URL search params
    const url = new URL(request.url);
    return url.searchParams.get(SESSION_ID_KEY);
  } else if (request instanceof URLSearchParams) {
    // If it's already URLSearchParams
    return request.get(SESSION_ID_KEY);
  }

  return null;
}
