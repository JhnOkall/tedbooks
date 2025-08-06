/**
 * @file This file defines the API route handler for managing the collection of books.
 * It provides endpoints for retrieving all books (with filtering and search capabilities)
 * and for creating a new book (an admin-only action).
 */

import { NextRequest, NextResponse } from 'next/server';
import Book from '@/models/Book';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { FilterQuery } from 'mongoose';
import { IBook } from '@/models/Book';

/**
 * Handles GET requests to fetch books from the database.
 * Supports filtering by genre, featured status, and a text search on title and author.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response containing the list of books.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const featured = searchParams.get('featured');

    // Build the MongoDB query object dynamically based on the provided search parameters.
    const query: FilterQuery<IBook> = {};

    if (search) {
      // Create a case-insensitive regex search across both the title and author fields.
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre) {
      query.genre = genre;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    // TODO: Implement pagination by accepting `page` and `limit` search parameters
    // and using `.skip()` and `.limit()` on the Mongoose query to handle large datasets.
    const books = await Book.find(query).sort({ createdAt: -1 });

    return NextResponse.json(books, { status: 200 });
  } catch (error) {
    console.error('Error fetching books:', error);
    // TODO: Implement a robust logging service for production environments.
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to create a new book.
 * This is a protected endpoint accessible only by users with the 'admin' role.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the new book's data.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the newly created book.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    // TODO: Use a validation library like Zod to parse and validate the request body
    // against the expected IBook schema before attempting to save it to the database.
    // This provides an early exit and clearer error messages for malformed requests.

    // Create a new book instance and save it to the database.
    const newBook = new Book(body);
    await newBook.save();

    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) {
    // Specifically handle Mongoose validation errors to provide a more detailed client-side error.
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation Error', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating book:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}