/**
 * @file This file defines the API route handlers for operations on a single site content block,
 * identified by its unique `key`. It supports fetching content (publicly) and
 * creating or updating content (admin-only).
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import { auth } from '@/auth';

/**
 * Handles GET requests to fetch a single site content block by its unique key.
 * This is a public endpoint, accessible to all users.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.key - The unique key of the content block to retrieve.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the content data or an error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    await connectDB();
    const { key } = params;

    const content = await SiteContent.findOne({ key });

    // If no content block is found with the given key, return a 404 Not Found response.
    if (!content) {
      return NextResponse.json(
        { message: `Content with key '${key}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    console.error(`Error fetching content for key ${params.key}:`, error);
    // TODO: Implement a robust logging service for production environments.
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to create or update a site content block by its unique key.
 * This is a protected endpoint accessible only by users with the 'admin' role.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the update payload.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.key - The unique key of the content block to create or update.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the updated content data.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  // Check for admin authentication.
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { key } = params;
    const body = await request.json();

    // TODO: Use a validation library like Zod to parse and validate the request body,
    // ensuring `title` and `content` are present and of the correct type.

    // Find a document by its key and update it. If it doesn't exist, create it.
    const updatedContent = await SiteContent.findOneAndUpdate(
      { key },
      { $set: { title: body.title, content: body.content } },
      {
        new: true, // Returns the modified document rather than the original.
        upsert: true, // Creates the document if no document matches the filter.
        runValidators: true, // Ensures that updates conform to the schema's validation rules.
      }
    );

    return NextResponse.json(updatedContent, { status: 200 });
  } catch (error: any) {
    // Specifically handle Mongoose validation errors for a clearer client-side response.
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation Error', errors: error.errors },
        { status: 400 }
      );
    }
    console.error(`Error updating content for key ${params.key}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}