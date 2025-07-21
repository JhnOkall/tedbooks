import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Book from '@/models/Book';

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

  // Step 1: Verify the incoming request is from our trusted central router
  const expectedSignature = crypto.createHmac('sha256', internalSecret).update(requestBody).digest('hex');

  if (expectedSignature !== signature) {
    console.warn('Invalid internal webhook signature received for TedBooks.');
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(requestBody);

  // Step 2: Process only the successful charge event to create an order
  if (event.event === 'charge.success') {
    try {
      await connectDB();

      const { reference, metadata, amount, customer, paid_at, id: transactionId } = event.data;

      // Idempotency Check: Prevent creating duplicate orders from webhook retries
      const existingOrder = await Order.findOne({ customId: reference });
      if (existingOrder) {
        console.log(`Order with reference ${reference} already exists. Acknowledging event.`);
        return NextResponse.json({ status: 'ok', message: 'Order already processed.' });
      }

      const orderItems = metadata.cartItems;
      let totalAmount = 0;

      // Recalculate total on the backend for security
      for (const item of orderItems) {
        const book = await Book.findById(item.bookId);
        if (book) {
          totalAmount += book.price * item.quantity;
        }
      }

      // Security check: ensure amount paid matches calculated total
      if (Math.round(totalAmount * 100) !== amount) {
          console.error(`Amount mismatch for ref ${reference}. Paystack: ${amount}, Calculated: ${Math.round(totalAmount * 100)}`);
          return NextResponse.json({ message: "Price mismatch detected." }, { status: 400 });
      }
      
      // Create the order
      await Order.create({
        user: metadata.userId,
        items: orderItems,
        totalAmount: totalAmount,
        status: 'Paid',
        customId: reference,
        paymentDetails: {
          method: "Paystack",
          transactionId: transactionId,
          status: "Success",
          paidAt: new Date(paid_at),
        },
      });

      console.log(`Successfully created order for reference: ${reference}`);

    } catch (error: any) {
      console.error('[TEDBOOKS_WEBHOOK_ERROR]', error);
      // Return a 500 so the central router knows something went wrong
      return NextResponse.json({ message: "Error processing webhook", error: error.message }, { status: 500 });
    }
  }

  // Step 3: Acknowledge receipt of the event
  return NextResponse.json({ status: 'ok' });
}