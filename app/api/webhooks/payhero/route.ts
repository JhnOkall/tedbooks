import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';

// Define the expected payload structure for type safety
interface PayHeroPayload {
    paymentSuccess: boolean;
    reference: string;          // Internal PayHero reference
    user_reference: string;     // Our order's customId
    provider: string;           // e.g., 'm-pesa'
    providerReference: string;  // e.g., 'TCT3K99UFZ'
    amount: number;
    phone: string;              // e.g., '0708344101'
    customerName: string;
    channel: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: PayHeroPayload = await request.json();
    console.log("Received PayHero Webhook:", payload);

    // Only process successful payments
    if (!payload.paymentSuccess) {
      return NextResponse.json({ message: "Payment was not successful." }, { status: 200 });
    }

    await connectDB();

    // 1. Find the order in our database using the reference we provided
    const order = await Order.findOne({ customId: payload.user_reference });

    if (!order) {
      // This is a critical error. The order should exist.
      console.error(`Webhook Error: Order with customId ${payload.user_reference} not found.`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Update the order with payment details
    order.status = 'Completed';
    order.paymentProvider = 'payhero';
    order.providerReference = payload.providerReference;
    await order.save();

    // 3. Find the user associated with the order to update their phone
    const user = await User.findById(order.user);

    // 4. Update user's phone number if it doesn't exist
    if (user && !user.phone && payload.phone) {
        // Simple normalization for the phone number
        const normalizedPhone = payload.phone.startsWith('0') ? '254' + payload.phone.substring(1) : payload.phone;
        user.phone = normalizedPhone;
        await user.save();
        console.log(`Updated phone for user ${user._id} to ${normalizedPhone}`);
    }

    // Respond to PayHero to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("Error processing PayHero webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}