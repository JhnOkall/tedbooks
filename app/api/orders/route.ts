import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Book, { IBook } from '@/models/Book';  
import { auth } from '@/auth';

// Helper function to generate a custom order ID
const generateCustomId = async () => {
    const date = new Date();
    const year = date.getFullYear().toString(); 
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the last order for this month to create a sequential number
    const lastOrder = await Order.findOne({ 
        customId: new RegExp(`^ORD-${year}${month}`) 
    }).sort({ createdAt: -1 });

    let sequence = 1;
    if (lastOrder && lastOrder.customId) {
        const lastSequence = parseInt(lastOrder.customId.split('-')[2]);
        sequence = lastSequence + 1;
    }
    
    return `ORD-${year}${month}-${String(sequence).padStart(4, '0')}`;
};


// GET orders (scoped by user role)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { user } = session;

    // Build query based on user role
    const query = user.role === 'admin' ? {} : { user: user.id };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Show newest first
      .populate('user', 'name email'); // For admins, include user details

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new order
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { items }: { items: { bookId: string; quantity: number }[] } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'Order must contain at least one item' }, { status: 400 });
    }

    const bookIds = items.map(item => item.bookId);
    const booksInDB = await Book.find({ '_id': { $in: bookIds } }) as IBook[];

    if (booksInDB.length !== items.length) {
      return NextResponse.json({ message: 'One or more books in the order are invalid.' }, { status: 400 });
    }

    const booksMap = new Map(booksInDB.map(book => [book._id.toString(), book]));
    
    let totalAmount = 0;
    const orderItems = items.map(item => {
      const book = booksMap.get(item.bookId);
      if (!book) throw new Error(`Book with id ${item.bookId} not found`);

      const itemTotal = book.price * item.quantity;
      totalAmount += itemTotal;
      
      return {
        book: book._id,
        title: book.title,
        author: book.author,
        quantity: item.quantity,
        priceAtPurchase: book.price,
        coverImage: book.coverImage,
        // Conditionally add the downloadUrl if the book has a fileUrl
        ...(book.fileUrl && { downloadUrl: book.fileUrl }), 
      };
    });

    const newOrder = new Order({
      customId: await generateCustomId(),
      user: session.user.id,
      items: orderItems,
      totalAmount,
      status: 'Pending',
    });

    await newOrder.save();

    return NextResponse.json(newOrder, { status: 201 });

  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}