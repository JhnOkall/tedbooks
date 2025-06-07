import { NextRequest, NextResponse } from 'next/server';
import Book from '@/models/Book';
import { auth } from '@/auth';
import connectDB from '@/lib/db';

// GET a single book by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    const book = await Book.findById(id);

    if (!book) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(book, { status: 200 });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH (update) a book by ID (Admin Only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // 1. Check for admin authentication
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = params;
    const body = await request.json();

    // 2. Find and update the book
    // { new: true } returns the updated document
    // { runValidators: true } ensures the update follows the schema
    const updatedBook = await Book.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBook) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json(updatedBook, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    console.error('Error updating book:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a book by ID (Admin Only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // 1. Check for admin authentication
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = params;

    const deletedBook = await Book.findByIdAndDelete(id);

    if (!deletedBook) {
      return NextResponse.json({ message: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Book deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}