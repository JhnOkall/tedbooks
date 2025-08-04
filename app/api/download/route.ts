import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db';
import Order from '@/models/Order'; 
import Book from '@/models/Book'; 
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Configure Cloudinary with your credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  // 1. Authenticate the user session
  const session = await auth();
  if (!session?.user?.id) { 
    return NextResponse.json({ message: 'Unauthorized: You must be logged in to download files.' }, { status: 401 });
  }

  try {
    await connectDB();
    const { orderId, bookId } = await req.json();

    // 2. Validate the incoming request body
    if (!orderId || !bookId) {
      return NextResponse.json({ message: 'Bad Request: Order ID and Book ID are required.' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(bookId)) {
      return NextResponse.json({ message: 'Bad Request: Invalid Order or Book ID format.' }, { status: 400 });
    }

    // 3. Find the order and verify ownership
    const order = await Order.findOne({ 
      _id: orderId, 
      user: session.user.id 
    });
    
    if (!order) {
      return NextResponse.json({ message: 'Order not found or access denied.' }, { status: 404 });
    }
    
    // 4. Verify the requested book is part of that order
    const itemInOrder = order.items.find(item => item.book.toString() === bookId);

    if (!itemInOrder) {
      return NextResponse.json({ 
        message: 'Forbidden: This book is not part of the specified order.',
      }, { status: 403 });
    }

    // 5. Fetch the book's file information
    const book = await Book.findById(bookId);
    if (!book || !book.filePublicId) { 
        return NextResponse.json({ message: 'Book file not found or is missing data.' }, { status: 404 });
    }

    // 6. Generate secure, time-limited download URL
    const signedUrl = cloudinary.utils.private_download_url(
  `book-files/${book.filePublicId}`,
  'pdf',
  {
    resource_type: 'raw',
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 300,
    attachment: true,
  }
);


    // 7. Return the signed URL to the frontend
    return NextResponse.json({ url: signedUrl });

  } catch (error) {
    console.error('Error in download link generation API:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}