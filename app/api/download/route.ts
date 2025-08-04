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

    // Validate that the provided IDs are in a valid format to prevent database errors
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(bookId)) {
      return NextResponse.json({ message: 'Bad Request: Invalid Order or Book ID format.' }, { status: 400 });
    }

    // 3. --- SECURITY CHECK 1: Find the order and verify ownership ---
    // This single query efficiently checks if the order exists AND if it belongs to the current user.
    const order = await Order.findOne({ 
      _id: orderId, 
      user: session.user.id 
    });
    
    // If no order is found, it's either non-existent or belongs to someone else.
    // We return a 404 to avoid revealing the existence of the order to an unauthorized user.
    if (!order) {
      return NextResponse.json({ message: 'Order not found or access denied.' }, { status: 404 });
    }
    
    // 4. --- SECURITY CHECK 2: Verify the requested book is part of that order ---
    // The 'book' field in the items array is an ObjectId, so we must convert it to a string for comparison.
    const itemInOrder = order.items.find(item => item.book.toString() === bookId);

    if (!itemInOrder) {
      // The user owns the order but is requesting a book not included in it.
      return NextResponse.json({ 
        message: 'Forbidden: This book is not part of the specified order.',
      }, { status: 403 });
    }

    // 5. Fetch the book's file information from the Book collection
    const book = await Book.findById(bookId);
    if (!book || !book.filePublicId) { 
        return NextResponse.json({ message: 'Book file not found or is missing data.' }, { status: 404 });
    }

    console.log(`Generating signed URL for user ${session.user.id}, book: ${book.title}`);

    // 6. --- GENERATE SECURE, TIME-LIMITED DOWNLOAD URL ---
    // Generate a signed Cloudinary URL that expires in 5 minutes (300 seconds).
    // The 'attachment' flag prompts the browser's "Save As..." dialog.
    const signedUrl = cloudinary.utils.private_download_url(book.filePublicId, 'pdf', {
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 300, // URL is valid for 5 minutes
        attachment: true, // Tells the browser to download the file instead of displaying it
    });

    // 7. Return the signed URL to the frontend
    return NextResponse.json({ url: signedUrl });

  } catch (error) {
    console.error('Error in download link generation API:', error);
    // Return a generic error message to the client for security
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}