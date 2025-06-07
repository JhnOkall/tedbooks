/**
 * @file Next.js application configuration.
 * This file is used to customize the behavior of the Next.js framework,
 * including build-time checks, image optimization, and other advanced settings.
 * @type {import('next').NextConfig}
 */

import type { NextConfig } from 'next';

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
        // Allows placeholder images from 'placehold.co' for development and testing purposes.
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        // Whitelists the Vercel Blob storage service, which is used for hosting production assets like book cover images.
        protocol: 'https',
        hostname: '75rfypg2otkow6jl.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
        // TODO: This Vercel Blob hostname is project-specific. If the project is moved or the blob store
        // is reconfigured, this value will need to be updated. Consider moving this to an environment
        // variable for easier management across different environments.
      },
    ],
  },
};

export default nextConfig;