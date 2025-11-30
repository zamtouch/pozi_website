import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Use our proxy API route for all Directus images
    // This avoids authentication issues with Next.js Image Optimization
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/images/**',
      },
    ],
    // Disable image optimization for external Directus URLs since we're using proxy
    unoptimized: false,
  },
};

export default nextConfig;
