/**
 * @file This file defines the API route handlers for managing customer orders.
 * It provides endpoints for fetching orders (with access control based on user role)
 * and for creating a new order.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Book, { IBook } from '@/models/Book';
import { auth } from '@/auth';

/**
 * Generates a unique, human-readable custom ID for a new order.
 * The format is `ORD-YYYYMM-NNNN` (e.g., ORD-202407-0001).
 *
 * @returns {Promise<string>} A promise that resolves to the new custom order ID.
 */
const generateCustomId = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `ORD-${year}${month}`;

  // Find the most recent order from the current month to determine the next sequence number.
  const lastOrder = await Order.findOne({
    customId: new RegExp(`^${prefix}`),
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (lastOrder && lastOrder.customId) {
    // Extract the sequence number from the last order's ID.
    const lastSequence = parseInt(lastOrder.customId.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  // TODO: In a high-concurrency environment, this sequence generation could lead to race conditions.
  // For a production system, consider using a more robust method like a dedicated counter collection
  // in MongoDB with atomic increments, or relying on the database's native `_id`.
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Handles GET requests to fetch orders.
 * - If the user is an admin, it returns all orders.
 * - If the user is a standard user, it returns only their own orders.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the list of orders.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { user } = session;

    // Dynamically build the query based on the user's role for access control.
    const query = user.role === 'admin' ? {} : { user: user.id };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Return the newest orders first.
      .populate('user', 'name email'); // For admin queries, populate user details for context.

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    // TODO: Implement a robust logging service for production environments.
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to create a new order.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the order items.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the newly created order.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { items }: { items: { bookId: string; quantity: number }[] } =
      await request.json();

    // Basic validation to ensure the order is not empty.
    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }
    // TODO: Implement more robust validation for the request body using a library like Zod.

    // Fetch all books in the order in a single database query for efficiency.
    const bookIds = items.map((item) => item.bookId);
    const booksInDB = (await Book.find({ _id: { $in: bookIds } })) as IBook[];

    // Ensure all book IDs provided in the request correspond to existing books.
    if (booksInDB.length !== items.length) {
      return NextResponse.json(
        { message: 'One or more books in the order are invalid.' },
        { status: 400 }
      );
    }

    // Create a map for quick lookups to construct the order items.
    const booksMap = new Map(
      booksInDB.map((book) => [book._id.toString(), book])
    );

    let totalAmount = 0;
    // Construct the `orderItems` array with denormalized data for historical accuracy.
    const orderItems = items.map((item) => {
      const book = booksMap.get(item.bookId);
      if (!book) throw new Error(`Book with id ${item.bookId} not found`);

      totalAmount += book.price * item.quantity;

      return {
        book: book._id,
        title: book.title,
        author: book.author,
        quantity: item.quantity,
        priceAtPurchase: book.price,
        coverImage: book.coverImage,
        // TODO: This should not directly expose a static file URL. Implement a secure
        // mechanism to generate time-limited download URLs when a user accesses their order.
        ...(book.fileUrl && { downloadUrl: book.fileUrl }),
      };
    });

    const newOrder = new Order({
      customId: await generateCustomId(),
      user: session.user.id,
      items: orderItems,
      totalAmount,
      status: 'Pending', // Orders are created with a 'Pending' status.
    });

    await newOrder.save();

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation Error', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating order:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}