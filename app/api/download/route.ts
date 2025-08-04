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

    if (!orderId || !bookId) {
      return NextResponse.json({ message: 'Order ID and Book ID are required.' }, { status: 400 });
    }

    // --- SECURITY CHECK ---
    // 1. Find the order and verify the current user owns it.
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Order not found or access denied.' }, { status: 404 });
    }
    
    // 2. Verify the requested book is actually part of that order.
    const itemInOrder = order.items.find(
      (item: IOrderItem) => item.book.toString() === bookId
    );
    if (!itemInOrder) {
      return NextResponse.json({ message: 'This book is not part of the specified order.' }, { status: 403 });
    }

    // --- GENERATE SIGNED URL ---
    const book = await Book.findById(bookId);
    if (!book || !book.filePublicId) { 
        return NextResponse.json({ message: 'Book file not found.' }, { status: 404 });
    }

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