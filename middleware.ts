import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dynamicRoutes } from "./app/config";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/", // Allow the homepage without authentication
  "/settings", // Allow the settings page without authentication
  "/api/chat(.*)", // Allow chat API for unauthenticated users
]);

export default clerkMiddleware(async (auth, request) => {
  // Check if the route is public
  if (isPublicRoute(request)) {
    return; // Allow access to public routes without authentication
  }

  // Protect all other routes
  await auth.protect();
});

// This middleware will set dynamic rendering for routes that need useSearchParams
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check if the current route is in our list of dynamic routes
  const path = request.nextUrl.pathname;
  if (dynamicRoutes.includes(path)) {
    // Set header for dynamic rendering
    response.headers.set("x-middleware-cache", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/modules",
    "/modules/resources/new",
    "/settings",
  ],
};
