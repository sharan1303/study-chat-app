/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img.clerk.com", "images.clerk.dev"],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
