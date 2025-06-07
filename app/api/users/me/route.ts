/**
 * @file This file defines the API route handler for retrieving the profile
 * of the currently authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

/**
 * Handles GET requests to fetch the profile data for the currently logged-in user.
 * It uses the session information to securely identify and retrieve the user's
 * document from the database.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the user's profile data or an error.
 */
export async function GET(request: NextRequest) {
  // Step 1: Get the current session to identify the logged-in user.
  const session = await auth();

  // If there is no valid session or user ID, the user is not authenticated.
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Step 2: Connect to the database.
    await connectDB();

    // Step 3: Fetch the user document from the database using the ID from the session.
    // TODO: [Security] For enhanced security and to avoid exposing unnecessary data, use `.select()`
    // to explicitly choose which fields to return (e.g., `.select('name email image phone')`).
    // This prevents potentially sensitive fields from being inadvertently sent to the client.
    const user = await User.findById(session.user.id);

    // Step 4: Handle the case where the user ID from the session does not correspond to a user in the database.
    // This could happen if the user was deleted after their session was created.
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Step 5: Return the user profile data.
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    // TODO: [Production] Integrate a dedicated logging service (e.g., Sentry, Axiom)
    // for better error tracking and alerting in production.
    console.error("Error fetching current user's profile:", error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}