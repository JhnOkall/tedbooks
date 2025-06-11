/**
 * @file This file defines the API route for generating a signed signature for direct Cloudinary uploads.
 * It is a protected, admin-only endpoint that does not handle file data directly.
 */

import { NextResponse, NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/auth';

// Configure Cloudinary with your credentials from environment variables.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Handles POST requests to generate a signed upload signature for Cloudinary.
 * The client sends metadata (filename, uploadType), and the server returns a signature
 * and parameters that authorize a direct upload from the client to Cloudinary.
 *
 * @param {NextRequest} request - The incoming HTTP request with JSON body.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Step 1: Authenticate the session and verify admin privileges.
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: 'Forbidden: Admins only' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { public_id, folder, resource_type } = body;

    if (!public_id || !folder || !resource_type) {
        return NextResponse.json(
            { success: false, message: 'Missing required parameters for signing.' },
            { status: 400 }
        );
    }
    
    // Step 2: Prepare parameters for the signature.
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Build parameters based on resource type
    const paramsToSign: Record<string, any> = {
      timestamp,
      public_id,
      folder,
    };

    // For raw files (non-images), include use_filename parameter
    if (resource_type === 'raw') {
      paramsToSign.use_filename = true;
    }

    // Step 3: Generate the signature on the server-side.
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string
    );

    // Step 4: Return the signature and other necessary details to the client.
    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      // Return the resource_type so client knows which endpoint to use
      resource_type,
      // Return the parameters that were signed so client knows what to include
      signed_params: paramsToSign,
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { success: false, message: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}