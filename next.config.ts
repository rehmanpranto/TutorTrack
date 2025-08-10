import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode temporarily to reduce hydration errors
  reactStrictMode: false,
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    unoptimized: true
  }
};

export default nextConfig;
