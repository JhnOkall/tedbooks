import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order, { IOrderItem } from '@/models/Order'; 
import Book from '@/models/Book'; 
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) { 
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { orderId, bookId } = await req.json();

    console.log('Download request:', { orderId, bookId, userId: session.user.id });

    if (!orderId || !bookId) {
      return NextResponse.json({ message: 'Order ID and Book ID are required.' }, { status: 400 });
    }

    // --- SECURITY CHECK ---
    // 1. Find the order and verify the current user owns it.
    // Make sure to populate the items.book field if it's referenced
    const order = await Order.findById(orderId).populate('items.book');
    
    console.log('Found order:', {
      orderId: order?._id,
      orderUserId: order?.user?.toString(),
      sessionUserId: session.user.id,
      itemsCount: order?.items?.length,
      items: order?.items?.map((item: IOrderItem) => ({
        bookId: item.book?.toString ? item.book.toString() : item.book,
        title: item.title
      }))
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    if (order.user.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Access denied.' }, { status: 403 });
    }
    
    // 2. Verify the requested book is actually part of that order.
    // Handle both ObjectId and string comparisons
    const itemInOrder = order.items.find((item: IOrderItem) => {
      const itemBookId = item.book?.toString ? item.book.toString() : item.book;
      console.log('Comparing:', { itemBookId, requestedBookId: bookId });
      return itemBookId === bookId;
    });

    if (!itemInOrder) {
      console.log('Book not found in order. Available books:', 
        order.items.map((item: IOrderItem) => ({
          bookId: item.book?.toString ? item.book.toString() : item.book,
          title: item.title
        }))
      );
      return NextResponse.json({ 
        message: 'This book is not part of the specified order.',
        availableBooks: order.items.map((item: IOrderItem) => ({
          bookId: item.book?.toString ? item.book.toString() : item.book,
          title: item.title
        }))
      }, { status: 403 });
    }

    // --- GENERATE SIGNED URL ---
    const book = await Book.findById(bookId);
    if (!book || !book.filePublicId) { 
        return NextResponse.json({ message: 'Book file not found.' }, { status: 404 });
    }

    console.log('Generating signed URL for book:', { bookId, filePublicId: book.filePublicId });

    // Generate a signed URL that expires in 5 minutes (300 seconds)
    // The `attachment` flag tells the browser to prompt a download dialog.
    const signedUrl = cloudinary.utils.private_download_url(book.filePublicId, 'pdf', {
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 300, // Expires in 5 minutes
        attachment: true,
    });

    return NextResponse.json({ url: signedUrl });

  } catch (error) {
    console.error('Download link generation error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}