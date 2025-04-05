import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamicRoutes } from "./app/config";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/", // Allow the homepage without authentication
  "/api/chat(.*)", // Allow chat API for unauthenticated users
  "/api/modules(.*)", // Allow modules API for anonymous users
  "/api/check-anonymous-data(.*)", // Allow checking anonymous data
  "/api/events(.*)", // Allow SSE events API for anonymous users
  "/api/events/ping(.*)", // Allow event ping endpoint for anonymous users
  "/modules(.*)", // Allow modules pages for anonymous users
  "/chat(.*)", // Allow chat pages for anonymous users
  // Add other public routes as needed
]);

// This combined middleware handles authentication, welcome chat redirection, and dynamic rendering
export default clerkMiddleware((auth, req: NextRequest) => {
  // Redirect users to welcome chat when they visit the root path for the first time
  if (req.nextUrl.pathname === "/") {
    // Check if visited cookie exists
    const visitedCookie = req.cookies.get("study-chat-visited");

    // If not visited before, redirect to welcome chat
    if (!visitedCookie) {
      // Create response with redirect
      const response = NextResponse.redirect(new URL("/chat/welcome", req.url));

      // Set cookie to indicate they've visited
      response.cookies.set("study-chat-visited", "true", {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });

      return response;
    }
  }

  // The existing chat page redirect should still work too
  if (req.nextUrl.pathname === "/chat") {
    // Check if visited cookie exists
    const visitedCookie = req.cookies.get("study-chat-visited");

    // If not visited before, redirect to welcome chat
    if (!visitedCookie) {
      // Create response with redirect
      const response = NextResponse.redirect(new URL("/chat/welcome", req.url));

      // Set cookie to indicate they've visited
      response.cookies.set("study-chat-visited", "true", {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });

      return response;
    }
  }

  // Check if the route is public
  if (isPublicRoute(req)) {
    return; // Allow access to public routes without authentication
  }

  // For protected routes, ensure user is authenticated
  auth.protect();

  // Handle dynamic rendering after auth check
  const path = req.nextUrl.pathname;
  const response = NextResponse.next();

  if (dynamicRoutes.includes(path)) {
    // Set header for dynamic rendering
    response.headers.set("x-middleware-cache", "no-cache");
  }

  return response;
});

// Export the Clerk matcher config
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Add API routes explicitly to ensure they're protected
    "/api/(.*)",
    "/trpc/(.*)",
    "/modules",
    "/settings",
    "/chat", // Include /chat path for welcome chat redirection
    "/", // Include root path for welcome redirection
  ],
};
