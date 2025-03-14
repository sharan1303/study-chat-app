/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img.clerk.com", "images.clerk.dev"],
  },
  experimental: {
    ppr: true,
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
