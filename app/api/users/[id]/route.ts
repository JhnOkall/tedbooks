/**
 * @file This file defines the API route handlers for operations on a single user,
 * identified by their unique MongoDB `_id`. It supports fetching, updating,
 * and deleting a specific user, with appropriate access control logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

/**
 * Handles GET requests to fetch a single user's profile by their ID.
 * Access is restricted: a user can fetch their own profile, while an admin can fetch any profile.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The unique ID of the user to retrieve.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the user data or an error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Security check: A user can only access their own profile unless they are an admin.
  if (session.user.id !== params.id && session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    // TODO: Add validation to ensure `params.id` is a valid MongoDB ObjectId format before querying.
    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // TODO: [Security] Use `.select()` to exclude sensitive fields that should not be exposed
    // via the API, such as `emailVerified` or other internal data.
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    // TODO: Implement a robust logging service for production environments.
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to update an existing user's profile by their ID.
 * A user can update their own profile, while an admin can update any profile.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the update payload.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The unique ID of the user to update.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the updated user data.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Security check: A user can only update their own profile, unless they are an admin.
  if (session.user.id !== params.id && session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await request.json();

    // Security sanitization: If the user is not an admin, prevent them from
    // changing protected fields like `role` or `email`.
    if (session.user.role !== 'admin') {
      delete body.role;
      delete body.email; // Email is tied to the authentication provider and should not be changed here.
    }
    // TODO: Use a validation library like Zod to define separate, explicit schemas for
    // user updates vs. admin updates. This is a more robust approach than deleting keys.

    const updatedUser = await User.findByIdAndUpdate(params.id, body, {
      new: true, // Returns the modified document rather than the original.
      runValidators: true, // Ensures that updates conform to the schema's validation rules.
    });

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation Error', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles DELETE requests to remove a user by their ID.
 * This is a protected endpoint accessible only by users with the 'admin' role.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The unique ID of the user to delete.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response confirming deletion.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only' },
      { status: 403 }
    );
  }

  // Safety measure to prevent an admin from accidentally deleting their own account via this endpoint.
  if (session.user.id === params.id) {
    return NextResponse.json(
      { message: 'Admins cannot delete their own account via this API.' },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const deletedUser = await User.findByIdAndDelete(params.id);

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // TODO: Implement a soft delete strategy (e.g., setting an `isArchived` flag) to preserve
    // data integrity, especially if users have associated orders or other important records.
    // TODO: Consider the cascading effects of deleting a user. What should happen to their
    // associated data like orders or cart? This business logic should be defined and implemented.

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}