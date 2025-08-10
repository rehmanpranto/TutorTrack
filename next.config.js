/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error reporting
  reactStrictMode: true,
  
  // Disable React dev overlay errors in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features
  experimental: {
    // No experimental features needed for Next.js 15
  },
  
  // Disable X-Powered-By header for security
  poweredByHeader: false,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
