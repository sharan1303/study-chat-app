import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Use proper catch-all route patterns with (.*)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)", // This matches /sign-in and all routes under it
  "/sign-up(.*)", // This matches /sign-up and all routes under it
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
