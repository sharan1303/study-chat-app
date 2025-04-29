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
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "www.youtube.com",
      },
      // Common domains for source images
      {
        protocol: "https",
        hostname: "*.google.com",
      },
      {
        protocol: "https",
        hostname: "*.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
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
