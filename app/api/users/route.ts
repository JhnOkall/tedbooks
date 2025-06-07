import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

// GET all users (Admin Only)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
  }

  try {
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new user (Admin Only)
// Note: General user creation is handled by the auth sign-in flow.
// This is for manual admin-level user creation.
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
    }
  
    try {
      await connectDB();
      const body = await request.json();

      const { email, name, role, phone } = body;
      if (!email || !name) {
        return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 }); // 409 Conflict
      }
  
      const newUser = new User({ email, name, role, phone });
      await newUser.save();
  
      return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
      }
      console.error('Error creating user:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  }