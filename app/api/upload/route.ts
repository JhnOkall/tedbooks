/**
 * @file This file defines the API route handler for uploading files to Vercel Blob storage.
 * It is a protected, admin-only endpoint.
 */

import { put, PutBlobResult } from '@vercel/blob';
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { customAlphabet } from 'nanoid'; // A great library for short, unique IDs

// Using nanoid for shorter, URL-friendly unique IDs instead of UUIDs.
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
);

/**
 * Configuration for different upload types.
 * Defines allowed content types and maximum file sizes.
 */
const UPLOAD_CONFIG = {
  cover: {
    path: 'images/covers/',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSizeMB: 10, // 10 MB
  },
  book: {
    path: 'books/',
    allowedTypes: ['application/pdf', 'application/epub+zip'],
    maxSizeMB: 50, // 50 MB
  },
};

/**
 * Sanitizes and formats a filename to be URL-friendly (a "slug").
 * Example: "The Great Gatsby!" -> "the-great-gatsby"
 * @param filename The original filename.
 * @returns A URL-safe string.
 */
function slugify(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // Remove file extension
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
}

/**
 * Handles POST requests to upload a file.
 * The upload type and original filename are passed as URL search parameters.
 *
 * @param {NextRequest} request - The incoming HTTP request.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Step 1: Authenticate the session and verify admin privileges.
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only' },
      { status: 403 }
    );
  }

  // Step 2: Extract parameters and validate request body.
  const { searchParams } = new URL(request.url);
  const originalFilename = searchParams.get('originalFilename');
  const uploadType = searchParams.get('uploadType') as keyof typeof UPLOAD_CONFIG;

  if (!originalFilename) {
    return NextResponse.json(
      { message: '`originalFilename` search parameter is required.' },
      { status: 400 }
    );
  }

  if (!uploadType || !UPLOAD_CONFIG[uploadType]) {
    return NextResponse.json(
      {
        message: `Invalid 'uploadType'. Must be one of: ${Object.keys(
          UPLOAD_CONFIG
        ).join(', ')}`,
      },
      { status: 400 }
    );
  }

  if (!request.body) {
    return NextResponse.json(
      { message: 'No file content was provided in the request body.' },
      { status: 400 }
    );
  }

  // Step 3: Validate file type and size based on configuration.
  const config = UPLOAD_CONFIG[uploadType];
  const contentType = request.headers.get('content-type');
  const contentLength = request.headers.get('content-length');

  if (!contentType || !config.allowedTypes.includes(contentType)) {
    return NextResponse.json(
      {
        message: `Invalid file type. Allowed types for '${uploadType}' are: ${config.allowedTypes.join(
          ', '
        )}`,
      },
      { status: 415 } // Unsupported Media Type
    );
  }

  if (contentLength && parseInt(contentLength, 10) > config.maxSizeMB * 1024 * 1024) {
    return NextResponse.json(
      { message: `File size exceeds the ${config.maxSizeMB}MB limit.` },
      { status: 413 } // Payload Too Large
    );
  }

  // Step 4: Generate a secure, unique pathname for storage.
  const fileExtension = originalFilename.split('.').pop() || '';
  let finalPathname: string;

  if (uploadType === 'cover') {
    // For images: Generate a unique name to prevent collisions.
    const uniqueId = nanoid();
    finalPathname = `${config.path}${uniqueId}.${fileExtension}`;
  } else {
    // For books: Create a clean, readable "slug" for the filename.
    const slug = slugify(originalFilename);
    finalPathname = `${config.path}${slug}.${fileExtension}`;
  }

  // Step 5: Stream the file to Vercel Blob storage.
  try {
    const blob = await put(finalPathname, request.body, {
      access: 'public',
      // We are generating a unique/sanitized name, so we don't need Vercel's random suffix.
      addRandomSuffix: false,
      // Pass the original content type to the blob storage.
      contentType: contentType,
      // For books, set Content-Disposition to ensure the browser prompts a download
      // with the original, human-readable filename.
      ...(uploadType === 'book' && {
        contentDisposition: `attachment; filename="${originalFilename}"`,
      }),
    });

    // Step 6: On success, return the blob details.
    return NextResponse.json(blob);
  } catch (error: any) {
    // In a real production app, integrate a dedicated logging service (e.g., Sentry, Logtail).
    console.error('Error uploading to Vercel Blob:', error);

    // Return a generic error message to the client to avoid leaking implementation details.
    return NextResponse.json(
      { message: 'An internal error occurred during file upload.' },
      { status: 500 }
    );
  }
}