import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

// GET a single user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // A user can get their own profile, or an admin can get any profile.
  if (session.user.id !== params.id && session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH (update) a user by ID
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // A user can update their own profile, or an admin can update any profile.
    if (session.user.id !== params.id && session.user.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        await connectDB();
        const body = await request.json();

        // --- Security Sanitization ---
        // If the user is NOT an admin, prevent them from changing their role or email.
        if (session.user.role !== 'admin') {
            delete body.role;
            delete body.email; // Email is tied to auth and shouldn't be changed here.
        }

        const updatedUser = await User.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error: any) {
        if (error.name === 'ValidationError') {
            return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
        }
        console.error('Error updating user:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// DELETE a user by ID (Admin Only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
  }

  // Prevent admin from deleting their own account via this endpoint
  if (session.user.id === params.id) {
    return NextResponse.json({ message: 'Admins cannot delete their own account.' }, { status: 400 });
  }

  try {
    await connectDB();
    const deletedUser = await User.findByIdAndDelete(params.id);

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}