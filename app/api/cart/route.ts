import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { auth } from '@/auth';
import Cart from '@/models/Cart';
import Book from '@/models/Book';

// GET the user's cart
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const cart = await Cart.findOne({ user: session.user.id }).populate({
      path: 'items.book',
      model: Book,
    });

    if (!cart) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    
    // Transform data to match CartItem type structure
    const cartItems = cart.items.map((item: { book: any, quantity: number }) => ({
        ...item.book.toObject(), // Spread all book properties
        quantity: item.quantity,
    }));

    return NextResponse.json({ items: cartItems }, { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST - Add/Update/Remove/Merge items in the cart
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body: { items: { bookId: string, quantity: number }[] } = await request.json();

    const updatedCart = await Cart.findOneAndUpdate(
        { user: session.user.id },
        { 
            $set: {
                items: body.items.map(item => ({ book: item.bookId, quantity: item.quantity })),
            },
        },
        { upsert: true, new: true, runValidators: true }
    ).populate({
        path: 'items.book',
        model: Book,
    });

    const cartItems = updatedCart.items.map((item: { book: any, quantity: number }) => ({
        ...item.book.toObject(),
        quantity: item.quantity,
    }));

    return NextResponse.json({ items: cartItems }, { status: 200 });

  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}