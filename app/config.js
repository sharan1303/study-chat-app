/**
 * Configuration for dynamic routes in the application
 * These routes should not be statically generated during build
 */

export const dynamicRoutes = ["/modules", "/settings"];

export const dynamicParams = {
  "/[moduleName]": true,
};
