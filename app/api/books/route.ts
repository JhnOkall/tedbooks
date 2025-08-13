/**
 * @file This file defines the API route handler for managing the collection of books.
 * It provides endpoints for retrieving all books (with filtering, search, and pagination)
 * and for creating a new book (an admin-only action).
 */

import { NextRequest, NextResponse } from 'next/server';
import Book, { IBook } from '@/models/Book';
import Genre from '@/models/Genre';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import { FilterQuery } from 'mongoose';

/**
 * Handles GET requests to fetch books from the database.
 * Supports filtering by genre (slug or ID), featured status, exclusion of a specific ID,
 * pagination, limiting results, and a text search on title and author.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response containing the list of books.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const genreSlug = searchParams.get('genre');
    const genreId = searchParams.get('genreId');
    const featured = searchParams.get('featured');
    const excludeId = searchParams.get('exclude');
    const limit = searchParams.get('limit');
    const page = searchParams.get('page');

    const query: FilterQuery<IBook> = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    // Handle genre filtering
    if (genreId) {
      query.genre = genreId;
    } else if (genreSlug) {
      const genre = await Genre.findOne({ slug: genreSlug }).lean();
      if (genre) {
        query.genre = genre._id;
      } else {
        return NextResponse.json([], { status: 200 });
      }
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    // Build the query
    let dbQuery = Book.find(query)
      .populate('genre')
      .sort({ createdAt: -1 });

    // Handle pagination
    if (page) {
      const pageNumber = parseInt(page, 10);
      const pageSize = limit ? parseInt(limit, 10) : 12; // Default to 12 books per page
      
      if (!isNaN(pageNumber) && pageNumber > 0) {
        const skip = (pageNumber - 1) * pageSize;
        dbQuery = dbQuery.skip(skip).limit(pageSize);
      }
    } else if (limit) {
      // If only limit is provided (for related books, etc.)
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit)) {
        dbQuery = dbQuery.limit(parsedLimit);
      }
    }

    const books = await dbQuery;

    // For pagination requests, also return total count and pagination info
    if (page) {
      const total = await Book.countDocuments(query);
      const pageNumber = parseInt(page, 10);
      const pageSize = limit ? parseInt(limit, 10) : 12;
      
      return NextResponse.json({
        books,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / pageSize),
          totalBooks: total,
          hasNextPage: pageNumber * pageSize < total,
          hasPreviousPage: pageNumber > 1
        }
      }, { status: 200 });
    }

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
    const newBook = new Book(body);
    await newBook.save();

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