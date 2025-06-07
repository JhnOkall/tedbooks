/**
 * @file This file defines the API route handlers for operations on a single book,
 * identified by its unique ID. It supports fetching, updating (admin-only),
 * and deleting (admin-only) a specific book.
 */

import { NextRequest, NextResponse } from 'next/server';
import Book from '@/models/Book';
import { auth } from '@/auth';
import connectDB from '@/lib/db';

/**
 * Handles GET requests to fetch a single book by its ID.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @param {object} context - The context object containing route parameters.
 * @param {object} context.params - The route parameters.
 * @param {string} context.params.id - The unique ID of the book to retrieve.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the book data or an error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    // TODO: Add validation to ensure the provided `id` is a valid MongoDB ObjectId format
    // before querying the database to prevent malformed requests and potential errors.

    const book = await Book.findById(id);

    // If no book is found with the given ID, return a 404 Not Found response.
    if (!book) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book, { status: 200 });
  } catch (error) {
    console.error('Error fetching book:', error);
    // TODO: Implement a robust logging service for production environments.
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to update an existing book by its ID.
 * This is a protected endpoint accessible only by users with the 'admin' role.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the update payload.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The unique ID of the book to update.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the updated book data or an error.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check for admin authentication using the session.
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    // TODO: Use a validation library like Zod to parse and validate the request body.
    // This provides stronger type safety and more explicit control over which fields can be updated.

    // Find the book by its ID and apply the updates from the request body.
    const updatedBook = await Book.findByIdAndUpdate(id, body, {
      new: true, // Returns the modified document rather than the original.
      runValidators: true, // Ensures that updates conform to the schema's validation rules.
    });

    if (!updatedBook) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(updatedBook, { status: 200 });
  } catch (error: any) {
    // Specifically handle Mongoose validation errors for a clearer client-side response.
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation Error', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating book:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles DELETE requests to remove a book by its ID.
 * This is a protected endpoint accessible only by users with the 'admin' role.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The unique ID of the book to delete.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response confirming deletion or an error.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { id } = params;

    // TODO: Consider implementing a soft delete (e.g., setting an `isArchived: true` flag)
    // instead of a hard delete. This would preserve historical data integrity, especially
    // for past orders that reference this book.
    const deletedBook = await Book.findByIdAndDelete(id);

    if (!deletedBook) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Book deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}