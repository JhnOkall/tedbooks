import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { auth } from '@/auth';
import PayoutConfig from '@/models/PayoutConfig';

// GET all payout configurations
export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await connectDB();
  const configs = await PayoutConfig.find({}).sort({ createdAt: -1 });
  return NextResponse.json(configs);
}

// POST a new payout configuration
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const body = await request.json();

  // Validate total percentage
  const existingConfigs = await PayoutConfig.find({ isActive: true });
  const totalPercentage = existingConfigs.reduce((sum, config) => sum + config.payoutPercentage, 0);

  if (totalPercentage + body.payoutPercentage > 100) {
    return NextResponse.json({ message: `Adding this employee would exceed 100%. Current total is ${totalPercentage}%.` }, { status: 400 });
  }

  const newConfig = new PayoutConfig(body);
  await newConfig.save();
  return NextResponse.json(newConfig, { status: 201 });
}