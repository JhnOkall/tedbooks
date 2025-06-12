import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { auth } from '@/auth';
import PayoutConfig from '@/models/PayoutConfig';
import { processSinglePayout } from '@/lib/payout-utils'; 

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // 1. Secure the endpoint for admins only
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    // 2. Find the specific configuration to pay out
    const configToPayout = await PayoutConfig.findById(params.id);
    if (!configToPayout) {
        return NextResponse.json({ message: 'Payout configuration not found.' }, { status: 404 });
    }

    // 3. Call the centralized payout logic
    const result = await processSinglePayout(configToPayout);

    return NextResponse.json({ message: 'Payout initiated successfully!', result });

  } catch (error: any) {
    console.error("Manual payout failed:", error);
    // Provide the specific error message from the utility function
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}