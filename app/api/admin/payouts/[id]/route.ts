import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { auth } from '@/auth';
import PayoutConfig from '@/models/PayoutConfig';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  await PayoutConfig.findByIdAndDelete(params.id);
  return NextResponse.json({ message: 'Payout configuration deleted' }, { status: 200 });
}