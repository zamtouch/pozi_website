import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pozi2.omaridigital.com',
        port: '',
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;
