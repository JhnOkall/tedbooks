/**
 * @file This file defines the API route handler for managing the collection of books.
 * It provides endpoints for retrieving all books (with filtering and search capabilities)
 * and for creating a new book (an admin-only action).
 */

import { NextRequest, NextResponse } from 'next/server';
import Book, { IBook } from '@/models/Book';
import Genre from '@/models/Genre'; // --- MODIFICATION: Import Genre model ---
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { FilterQuery } from 'mongoose';

/**
 * Handles GET requests to fetch books from the database.
 * Supports filtering by genre (slug or ID), featured status, exclusion of a specific ID,
 * limiting results, and a text search on title and author.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response containing the list of books.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const genreSlug = searchParams.get('genre'); // This is the genre slug
    const genreId = searchParams.get('genreId'); // This is the genre _id
    const featured = searchParams.get('featured');
    const excludeId = searchParams.get('exclude');
    const limit = searchParams.get('limit');

    const query: FilterQuery<IBook> = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    // --- MODIFICATION START: Handle genre filtering ---
    if (genreId) {
      // If a specific genre ID is provided, use it directly.
      query.genre = genreId;
    } else if (genreSlug) {
      // If a slug is provided, find the genre's ID first.
      const genre = await Genre.findOne({ slug: genreSlug }).lean();
      if (genre) {
        query.genre = genre._id;
      } else {
        // If the genre slug is invalid, return no books.
        return NextResponse.json([], { status: 200 });
      }
    }
    // --- MODIFICATION END ---

    if (featured === 'true') {
      query.featured = true;
    }

    if (excludeId) {
      query._id = { $ne: excludeId }; // $ne means 'not equal'
    }

    // --- MODIFICATION START: Build the query dynamically ---
    let dbQuery = Book.find(query)
      .populate('genre') // Crucial step: Populate the genre field with the full document
      .sort({ createdAt: -1 });

    // Apply limit if provided (e.g., for related books)
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit)) {
        dbQuery = dbQuery.limit(parsedLimit);
      }
    }

    const books = await dbQuery;
    // --- MODIFICATION END ---

    return NextResponse.json(books, { status: 200 });
  } catch (error) {
    console.error('Error fetching books:', error);
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
    // The request body should contain the 'genre' as the ObjectId string of the selected genre.
    // Mongoose will automatically cast this string to an ObjectId.
    // TODO: Use a validation library like Zod.

    const newBook = new Book(body);
    await newBook.save();

    // Populate the genre before sending the response back
    await newBook.populate('genre');

    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) {
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