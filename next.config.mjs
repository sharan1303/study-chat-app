/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Disable static generation completely for production builds
  output: "standalone",

  // Configure image domains for profile pictures
  images: {
    domains: ["avatars.githubusercontent.com"],
  },

  // Disable ESLint during builds to speed up build time
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Force dynamic rendering
  experimental: {
    // Server actions are available by default in Next.js 14+
    appDocumentPreloading: false,
  },

  // Override static export setup for Vercel
  env: {
    NEXT_PUBLIC_FORCE_DYNAMIC: "true",
    NEXT_PRIVATE_STANDALONE: "1",
  },
};

export default nextConfig;
