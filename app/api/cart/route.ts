/**
 * @file This file defines the API route handlers for managing a user's shopping cart.
 * It provides endpoints for fetching the current user's cart and for completely
 * synchronizing the cart's contents in a single operation.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { auth } from '@/auth';
import Cart from '@/models/Cart';
import Book from '@/models/Book';

/**
 * Handles GET requests to fetch the authenticated user's shopping cart.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response containing the user's cart items.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    // Find the cart belonging to the authenticated user and populate the 'book' details for each item.
    const cart = await Cart.findOne({ user: session.user.id }).populate({
      path: 'items.book',
      model: Book,
    });

    // If the user does not have a cart yet, return an empty array.
    if (!cart) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    // Transform the populated cart data into the `CartItem` structure expected by the frontend.
    const cartItems = cart.items.map(
      (item: { book: any; quantity: number }) => ({
        // Spread the book object properties.
        ...item.book.toObject(),
        // Add the quantity property.
        quantity: item.quantity,
      })
    );
    // TODO: Define a more specific type for the populated `item` instead of using `any`
    // to improve type safety and code clarity.

    return NextResponse.json({ items: cartItems }, { status: 200 });
  } catch (error) {
    console.error('Error fetching cart:', error);
    // TODO: Implement a robust logging service for production environments.
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to create or completely overwrite the user's cart contents.
 * This "sync" approach replaces the entire `items` array with the payload from the client.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the full list of cart items.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the updated cart.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body: { items: { bookId: string; quantity: number }[] } =
      await request.json();

    // TODO: Implement validation for the request body using a library like Zod to ensure
    // it matches the expected structure and data types.

    // Find the cart for the current user and update its items. If a cart doesn't exist,
    // `upsert: true` will create a new one.
    const updatedCart = await Cart.findOneAndUpdate(
      { user: session.user.id },
      {
        $set: {
          items: body.items.map((item) => ({
            book: item.bookId,
            quantity: item.quantity,
          })),
        },
      },
      { upsert: true, new: true, runValidators: true } // Options to create if not found, return the new doc, and run schema validators.
    ).populate({
      path: 'items.book',
      model: Book,
    });

    // Transform the data for the frontend, same as in the GET handler.
    const cartItems = updatedCart.items.map(
      (item: { book: any; quantity: number }) => ({
        ...item.book.toObject(),
        quantity: item.quantity,
      })
    );

    return NextResponse.json({ items: cartItems }, { status: 200 });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}