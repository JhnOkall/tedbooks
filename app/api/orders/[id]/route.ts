/**
 * @file This file defines the API route handlers for operations on a single order,
 * identified by its unique MongoDB `_id`. It supports fetching an order with
 * access control and updating an order's status (admin-only).
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { auth } from '@/auth';

/**
 * Handles GET requests to fetch a single order by its ID.
 * Access is restricted: users can only view their own orders, while admins can view any order.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The unique ID of the order to retrieve.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the order data or an error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id:string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = params;

    // TODO: Add validation to check if `id` is a valid MongoDB ObjectId before querying the database.
    // This can prevent malformed requests from hitting the database and causing errors.

    const order = await Order.findById(id).populate('user', 'name email');

    // If no order is found with the given ID, return a 404 Not Found response.
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
    console.error('Error fetching order:', error);
    // TODO: Implement a robust logging service for production environments.
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Handles PATCH requests to update an existing order by its ID.
 * This is a protected endpoint accessible only by administrators and is currently
 * limited to updating the order's status.
 *
 * @param {NextRequest} request - The incoming HTTP request object containing the update payload.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The unique ID of the order to update.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the updated order data.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check for admin authentication.
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Forbidden: Admins only' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const { id } = params;
    const { status } = await request.json();

    // Validate that the provided status is one of the allowed values.
    // TODO: For more complex updates, use a validation library like Zod to define a schema for the request body.
    if (!status || !['Pending', 'Completed', 'Cancelled'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status provided' },
        { status: 400 }
      );
    }

    // Find the order by its ID and update its status.
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true } // Return the modified document and run schema validators.
    );

    if (!updatedOrder) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // TODO: Implement side effects for status changes, such as sending an email
    // notification to the user when an order is marked as 'Completed' or 'Cancelled'.

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error: any) {
    // Specifically handle Mongoose validation errors.
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Validation Error', errors: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating order:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}