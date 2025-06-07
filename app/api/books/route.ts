import { NextRequest, NextResponse } from 'next/server';
import Book from '@/models/Book';
import { auth } from '@/auth';
import connectDB from '@/lib/db';

// GET all books (with optional searching and filtering)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const query: any = {};

    if (search) {
      // Case-insensitive search on title and author
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    const books = await Book.find(query).sort({ createdAt: -1 });

    return NextResponse.json(books, { status: 200 });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new book (Admin Only)
export async function POST(request: NextRequest) {
  // 1. Check for admin authentication
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
  }

  try {
    await connectDB();

    const body = await request.json();

    // 2. Create and save the new book
    const newBook = new Book(body);
    await newBook.save();

    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) {
    // 3. Handle potential errors (e.g., validation)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating book:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}