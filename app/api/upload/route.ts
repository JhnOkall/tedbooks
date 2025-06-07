import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; 

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Check for admin authentication
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });
  }

  // 2. Get filename and file body
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No filename or file body provided.' }, { status: 400 });
  }

  // 3. Upload the file to Vercel Blob
  // The 'put' function handles the streaming and returns the blob details
  try {
    const blob = await put(filename, request.body, {
      access: 'public', // Make the file publicly accessible
    });
    
    // 4. Return the blob details (including the URL)
    return NextResponse.json(blob);

  } catch (error: any) {
    console.error("Error uploading to Vercel Blob:", error);
    return NextResponse.json({ message: 'Error uploading file.', error: error.message }, { status: 500 });
  }
}