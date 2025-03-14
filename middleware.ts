import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
