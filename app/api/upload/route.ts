/**
 * @file This file defines the API route handler for uploading files to Vercel Blob storage.
 * It is a protected, admin-only endpoint.
 */

import { put } from '@vercel/blob';
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';

/**
 * Handles POST requests to upload a file.
 * The file content is expected in the request body as a stream, and the desired
 * filename is passed as a URL search parameter.
 *
 * @param {NextRequest} request - The incoming HTTP request object, including the file stream.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response containing the details of the uploaded blob.
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

  // Step 2: Extract the filename from the URL's search parameters.
  const filename = request.nextUrl.searchParams.get('filename');

  // Step 3: Validate the presence of the filename and request body.
  if (!filename) {
    return NextResponse.json(
      { message: 'A filename must be provided via a search parameter.' },
      { status: 400 }
    );
  }
  if (!request.body) {
    return NextResponse.json(
      { message: 'No file content was provided in the request body.' },
      { status: 400 }
    );
  }

  // TODO: [Security] Sanitize the filename to prevent path traversal attacks and remove
  // potentially harmful characters. A best practice is to generate a unique server-side
  // filename (e.g., using a UUID) while preserving the original file extension.

  // TODO: Implement file type and size validation before uploading to control storage costs
  // and ensure only allowed file types (e.g., 'image/jpeg', 'application/pdf') are uploaded.

  // Step 4: Stream the file content to Vercel Blob storage.
  try {
    const blob = await put(filename, request.body, {
      access: 'public', // The uploaded file will be publicly accessible via its URL.
    });

    // Step 5: On successful upload, return the blob details provided by Vercel.
    return NextResponse.json(blob);
  } catch (error: any) {
    // TODO: [Production] Integrate a dedicated logging service for better error tracking.
    console.error('Error uploading to Vercel Blob:', error);

    // TODO: [Security] Return a generic error message in production to avoid leaking implementation details.
    return NextResponse.json(
      { message: 'Error uploading file.', error: error.message },
      { status: 500 }
    );
  }
}