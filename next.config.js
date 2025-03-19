/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    domains: ["img.clerk.com", "utfs.io"],
  },
};

module.exports = nextConfig;
