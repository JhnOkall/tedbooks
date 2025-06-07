import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable the experimental Node.js runtime for middleware.
  // This is required because your middleware now uses database logic (via auth.ts)
  // that is not compatible with the default Edge runtime.
  experimental: {
    nodeMiddleware: true,
  },
  // ----------------------

  /* Other config options */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '75rfypg2otkow6jl.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;