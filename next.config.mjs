/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Disable static generation completely for production builds
  output: "standalone",

  // Configure image domains for profile pictures
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Disable ESLint during builds to speed up build time
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Override static export setup for Vercel
  env: {
    NEXT_PUBLIC_FORCE_DYNAMIC: "true",
  },
};

export default nextConfig;
