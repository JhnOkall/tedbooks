import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/db'; // Assuming this is your DB connection utility
import Order from '@/models/Order'; // Assuming this is your Order model

/**
 * Handles GET requests to fetch a single order by its unique `customId` (Paystack reference).
 * Access is restricted: users can only view their own orders, while admins can view any order.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.ref - The unique customId/reference of the order.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the order data or an error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { ref } = params;

    // Use findOne to search by a field other than the primary _id
    const order = await Order.findOne({ customId: ref }).populate('user', 'name email');

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Security check: A user can only access their own order, unless they are an admin.
    if (
      order.user._id.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Error fetching order by reference:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}