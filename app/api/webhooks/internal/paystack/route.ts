// app\api\webhooks\internal\paystack\route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Book from '@/models/Book';
import { IOrderItem } from '@/models/Order'; // Import the sub-document type for clarity

/**
 * Internal webhook handler specifically for TedBooks.
 * This endpoint is called by the central Nyota webhook router, NOT directly by Paystack.
 */
export async function POST(req: Request) {
  const internalSecret = process.env.TEDBOOKS_INTERNAL_SECRET;

  if (!internalSecret) {
    console.error('FATAL: TEDBOOKS_INTERNAL_SECRET is not configured.');
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  const requestBody = await req.text();
  const signature = (await headers()).get('x-internal-signature');

  // Step 1: Verify the incoming request
  const expectedSignature = crypto.createHmac('sha256', internalSecret).update(requestBody).digest('hex');
  if (expectedSignature !== signature) {
    console.warn('Invalid internal webhook signature received for TedBooks.');
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(requestBody);

  // Step 2: Process only the successful charge event
  if (event.event === 'charge.success') {
    try {
      await connectDB();

      const { reference, metadata, amount, paid_at, id: transactionId } = event.data;

      // Idempotency Check
      const existingOrder = await Order.findOne({ 'paymentDetails.transactionId': transactionId });
      if (existingOrder) {
        console.log(`Order with transactionId ${transactionId} already exists. Acknowledging event.`);
        return NextResponse.json({ status: 'ok', message: 'Order already processed.' });
      }

      const cartItemsFromClient = metadata.cartItems;
      let totalAmountCalculated = 0;
      const orderItems: IOrderItem[] = [];

      // **MODIFIED BLOCK: Fetch book details to build the rich order items array**
      // This is the crucial change for data integrity and schema alignment.
      for (const item of cartItemsFromClient) {
        const book = await Book.findById(item.bookId);
        if (!book) {
          // If a book is not found, we should fail the entire transaction
          console.error(`Book with ID ${item.bookId} not found for order ref ${reference}.`);
          return NextResponse.json({ message: "Invalid item in cart." }, { status: 400 });
        }

        orderItems.push({
          book: book._id,
          title: book.title,
          author: book.author,
          quantity: item.quantity,
          priceAtPurchase: book.price,
          coverImage: book.coverImage,
          downloadUrl: book.fileUrl, 
        });

        totalAmountCalculated += book.price * item.quantity;
      }

      // Security check: ensure amount paid matches calculated total
      if (Math.round(totalAmountCalculated * 100) !== amount) {
          console.error(`Amount mismatch for ref ${reference}. Paystack: ${amount}, Calculated: ${Math.round(totalAmountCalculated * 100)}`);
          return NextResponse.json({ message: "Price mismatch detected." }, { status: 400 });
      }
      
      // **MODIFIED BLOCK: Create the order using the new, correct structure**
      await Order.create({
        user: metadata.userId,
        items: orderItems, // Use the rich array we just built
        totalAmount: totalAmountCalculated,
        status: 'Completed', // Use a valid status from the schema enum
        customId: reference,
        paymentDetails: { // Use the new structured paymentDetails object
          method: "Paystack",
          transactionId: transactionId,
          status: "Success",
          paidAt: new Date(paid_at),
        },
      });

      console.log(`Successfully created order for reference: ${reference}`);

    } catch (error: any) {
      console.error('[TEDBOOKS_WEBHOOK_ERROR]', error);
      return NextResponse.json({ message: "Error processing webhook", error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ status: 'ok' });
}