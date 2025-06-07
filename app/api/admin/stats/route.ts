import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Book from '@/models/Book';
import Order from '@/models/Order';
import User from '@/models/User';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const [bookCount, userCount, orderData] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      Order.aggregate([
        { $match: { status: 'Completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      bookCount,
      userCount,
      totalRevenue: orderData[0]?.totalRevenue || 0,
      completedOrders: orderData[0]?.totalOrders || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}