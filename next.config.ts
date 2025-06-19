/**
 * @file Next.js application configuration.
 * This file is used to customize the behavior of the Next.js framework,
 * including build-time checks, image optimization, and other advanced settings.
 * @type {import('next').NextConfig}
 */

import type { NextConfig } from 'next';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://placehold.co https://75rfypg2otkow6jl.public.blob.vercel-storage.com https://res.cloudinary.com",
  "font-src 'self'",
  "frame-src 'self' https://checkout.paystack.com https://js.paystack.co",
  "connect-src 'self' https://api.paystack.co",
].join('; ');

const nextConfig: NextConfig = {
  /**
   * TypeScript configuration for the Next.js build process.
   */
  typescript: {
    // TODO: [Critical] This setting is currently enabled to bypass TypeScript errors during the build.
    // This is intended for development convenience only. It is strongly recommended to set this
    // to `false` and resolve all TypeScript errors before deploying to production to ensure type safety and application stability.
    ignoreBuildErrors: true,
  },

  /**
   * ESLint configuration for the Next.js build process.
   */
  eslint: {
    // TODO: [Critical] This setting is currently enabled to bypass ESLint warnings and errors during the build.
    // This is intended for development convenience only. It is strongly recommended to set this
    // to `false` and adhere to the established linting rules to maintain code quality and prevent potential bugs.
    ignoreDuringBuilds: true,
  },

  /**
   * Configuration for the Next.js Image component (`next/image`).
   * `remotePatterns` defines a list of allowed external domains from which images can be served
   * and optimized. This is a security feature to prevent the use of arbitrary, un-trusted image sources.
   */
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
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: CSP,
          },
        ],
      },
    ];
  },
};

export default nextConfig;