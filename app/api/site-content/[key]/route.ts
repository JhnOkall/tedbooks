import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import { auth } from '@/auth';

// GET content by key (Public)
export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    await connectDB();
    const { key } = params;

    const content = await SiteContent.findOne({ key });

    if (!content) {
      // Return a 404 but with a default structure so the page can handle it
      return NextResponse.json({ message: `Content with key '${key}' not found.` }, { status: 404 });
    }

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    console.error(`Error fetching content for key ${params.key}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH (create or update) content by key (Admin Only)
export async function PATCH(request: NextRequest, { params }: { params: { key: string } }) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
  }

  try {
    await connectDB();
    const { key } = params;
    const body = await request.json();

    // The 'upsert: true' option creates the document if it doesn't exist.
    const updatedContent = await SiteContent.findOneAndUpdate(
      { key },
      { $set: { title: body.title, content: body.content } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(updatedContent, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
    }
    console.error(`Error updating content for key ${params.key}:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}