import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', 
  allowedDevOrigins: ['192.168.12.118'],
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
