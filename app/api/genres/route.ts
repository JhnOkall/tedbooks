/**
 * @file This file defines the API route handler for managing the collection of genres.
 * It provides endpoints for retrieving all genres and for creating a new genre.
 */

import { NextRequest, NextResponse } from 'next/server';
import Genre from '@/models/Genre';
import { auth } from '@/auth';
import connectDB from '@/lib/db';

/**
 * Handles GET requests to fetch all genres from the database.
 *
 * @returns {Promise<NextResponse>} A promise that resolves to the API response containing the list of genres.
 */
export async function GET() {
  try {
    await connectDB();

    // Fetch all genres and sort them alphabetically by name
    const genres = await Genre.find({}).sort({ name: 1 });

    return NextResponse.json(genres, { status: 200 });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to create a new genre.
 * This is a protected endpoint accessible only by users with the 'admin' role.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the new genre's data.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the newly created genre.
 */
export async function POST(request: NextRequest) {
  // Check for admin authentication
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
    // TODO: Use a validation library like Zod for the request body.

    // The slug is generated automatically by the pre-save hook in the Genre model
    const newGenre = new Genre(body);
    await newGenre.save();

    return NextResponse.json(newGenre, { status: 201 });
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation Error', errors: error.errors },
        { status: 400 }
      );
    }
    // Handle duplicate key errors (since name and slug are unique)
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'A genre with this name already exists.' },
        { status: 409 } // 409 Conflict
      );
    }
    console.error('Error creating genre:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}