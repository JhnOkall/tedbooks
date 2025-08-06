/**
 * @file This file defines the API route handler for managing a single genre,
 * identified by its unique slug. It supports retrieving, updating, and deleting a genre.
 */

import { NextRequest, NextResponse } from 'next/server';
import Genre from '@/models/Genre';
import Book from '@/models/Book'; // Needed for delete validation
import { auth } from '@/auth';
import connectDB from '@/lib/db';

type RouteParams = {
  params: {
    slug: string;
  };
};

/**
 * Handles GET requests to fetch a single genre by its slug.
 *
 * @param {NextRequest} _request - The incoming request (unused).
 * @param {RouteParams} params - The route parameters containing the slug.
 * @returns {Promise<NextResponse>} The genre document or a 404 error.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const genre = await Genre.findOne({ slug: params.slug });

    if (!genre) {
      return NextResponse.json({ message: 'Genre not found' }, { status: 404 });
    }

    return NextResponse.json(genre, { status: 200 });
  } catch (error) {
    console.error(`Error fetching genre ${params.slug}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles PUT requests to update an existing genre. Admin only.
 *
 * @param {NextRequest} request - The incoming request with the update data.
 * @param {RouteParams} params - The route parameters containing the slug.
 * @returns {Promise<NextResponse>} The updated genre document or an error.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const updatedGenre = await Genre.findOneAndUpdate(
      { slug: params.slug },
      body,
      { new: true, runValidators: true } // Return the updated doc and run schema validation
    );

    if (!updatedGenre) {
      return NextResponse.json({ message: 'Genre not found' }, { status: 404 });
    }

    return NextResponse.json(updatedGenre, { status: 200 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'A genre with this name already exists.' },
        { status: 409 }
      );
    }
    console.error(`Error updating genre ${params.slug}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles DELETE requests to remove a genre. Admin only.
 * Prevents deletion if any books are currently assigned to this genre.
 *
 * @param {NextRequest} _request - The incoming request (unused).
 * @param {RouteParams} params - The route parameters containing the slug.
 * @returns {Promise<NextResponse>} A success message or an error.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only' },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    const genre = await Genre.findOne({ slug: params.slug });
    if (!genre) {
      return NextResponse.json({ message: 'Genre not found' }, { status: 404 });
    }

    // --- Deletion Safety Check ---
    // Check if any books are associated with this genre.
    const bookCount = await Book.countDocuments({ genre: genre._id });
    if (bookCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete genre "${genre.name}" as it is assigned to ${bookCount} book(s). Please reassign them first.`,
        },
        { status: 400 } // Bad Request
      );
    }

    await Genre.findByIdAndDelete(genre._id);

    return NextResponse.json(
      { message: 'Genre deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting genre ${params.slug}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}