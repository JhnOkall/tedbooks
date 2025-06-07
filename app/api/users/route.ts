/**
 * @file This file defines the API route handlers for managing the collection of users.
 * It provides endpoints for retrieving all users and for manually creating a new user,
 * both of which are admin-only actions.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

/**
 * Handles GET requests to fetch all users from the database.
 * This is a protected endpoint accessible only by users with the 'admin' role.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response containing the list of users.
 */
export async function GET(request: NextRequest) {
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
    // Fetch all users and sort them by creation date in descending order.
    // TODO: For security, consider omitting sensitive fields like `emailVerified` or
    // other internal data from this public-facing (though admin-protected) endpoint.
    // Use `.select('-fieldName')` to exclude fields.
    const users = await User.find({}).sort({ createdAt: -1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    // TODO: Implement a robust logging service for production environments.
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to manually create a new user.
 * This is intended for administrative purposes, as the primary user creation flow
 * is handled through the NextAuth sign-in process.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the new user's data.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the newly created user.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await request.json();

    // TODO: Use a validation library like Zod to parse and validate the request body,
    // which provides a more declarative and robust way to handle validation logic.
    const { email, name, role, phone } = body;
    if (!email || !name) {
      return NextResponse.json(
        { message: 'Name and email are required.' },
        { status: 400 }
      );
    }

    // Check if a user with the provided email already exists to prevent duplicates.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with this email already exists.' },
        { status: 409 } // 409 Conflict is a suitable status code here.
      );
    }

    const newUser = new User({ email, name, role, phone });
    await newUser.save();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    // Specifically handle Mongoose validation errors.
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation Error', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}