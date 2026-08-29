import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.4'],
  async rewrites() {
    return [];
  },
};

export default nextConfig;
