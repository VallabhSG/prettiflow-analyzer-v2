import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL: This allows OpenNext to bundle your dependencies for the Cloud
  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;