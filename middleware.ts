import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dynamicRoutes } from "./app/config";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/", // Allow the homepage without authentication
  "/api/chat(.*)", // Allow chat API for unauthenticated users
  "/api/modules(.*)", // Allow modules API for anonymous users
  "/api/check-anonymous-data(.*)", // Allow checking anonymous data
  "/modules(.*)", // Allow modules pages for anonymous users
  // Add other public routes as needed
]);

// This combined middleware handles both authentication and dynamic rendering
export default clerkMiddleware((auth, req) => {
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
  ],
};
