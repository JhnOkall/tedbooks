import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

// Define the structure of the Paystack webhook payload for type safety.
interface PaystackChargeSuccessPayload {
  event: 'charge.success';
  data: {
    id: number;
    reference: string; // The unique transaction reference
    status: 'success';
    amount: number; // Amount in kobo/cents
    currency: string;
    paid_at: string;
    metadata: {
      orderId: string; // Our internal database order ID
      subaccount: string;
      [key: string]: any;
    };
    authorization: {
      authorization_code: string;
      card_type: string;
      last4: string;
      bank: string;
    };
    customer: {
      email: string;
    };
  };
}

/**
 * Handles incoming POST requests from our central webhook router.
 * It verifies the request, updates the corresponding order, and finalizes the transaction.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response.
 */
export async function POST(request: NextRequest) {
  const internalSecret = process.env.TEDBOOKS_INTERNAL_SECRET;

  if (!internalSecret) {
    console.error('FATAL: TEDBOOKS_INTERNAL_SECRET is not configured.');
    return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
  }

  const requestBody = await request.text();
  const signature = (await headers()).get('x-internal-signature');

  // Step 1: Verify the incoming request is from our trusted central router.
  const expectedSignature = crypto
    .createHmac('sha256', internalSecret)
    .update(requestBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.warn('Invalid internal webhook signature received.');
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }
  
  const payload: PaystackChargeSuccessPayload = JSON.parse(requestBody);
  console.log('Received verified internal Paystack Webhook:', payload.event);

  // Step 2: Only process successful charge events.
  // Acknowledge other events with a 200 OK to prevent retries.
  if (payload.event !== 'charge.success') {
    return NextResponse.json(
      { message: 'Event ignored. Not a successful charge.' },
      { status: 200 }
    );
  }

  try {
    await connectDB();

    // Step 3: Find the corresponding order using the `orderId` from metadata.
    // This is more reliable than using the transaction reference.
    const order = await Order.findById(payload.data.metadata.orderId);

    if (!order) {
      console.error(`Webhook Error: Order with ID ${payload.data.metadata.orderId} not found.`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Step 4: Idempotency Check. If already completed, do not process again.
    if (order.status === 'Completed') {
      return NextResponse.json(
        { message: 'Order already marked as completed.' },
        { status: 200 }
      );
    }

    // Step 5: Update the order with payment details.
    order.status = 'Completed';
    order.paymentProvider = 'paystack';
    // Store the Paystack transaction reference for reconciliation.
    order.providerReference = payload.data.reference; 
    await order.save();
    
    console.log(`Order ${order._id} successfully marked as 'Completed'.`);

    // TODO: [Feature] Trigger post-payment side effects here, e.g.:
    // - Send a confirmation email with receipt.
    // - Grant access to digital content.
    // - Notify an admin dashboard.

    // Step 6: Send a success response to acknowledge processing.
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing internal Paystack webhook:', error);
    return NextResponse.json(
      { error: 'Internal webhook processing failed.' },
      { status: 500 }
    );
  }
}