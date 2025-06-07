import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { PAYHERO_API_USERNAME, PAYHERO_API_PASSWORD } = process.env;
    if (!PAYHERO_API_USERNAME || !PAYHERO_API_PASSWORD) {
        return NextResponse.json({ message: "PayHero credentials not set" }, { status: 500 });
    }

    const authToken = Buffer.from(`${PAYHERO_API_USERNAME}:${PAYHERO_API_PASSWORD}`).toString('base64');
    const body = await request.json();

    try {
        const response = await fetch('https://backend.payhero.co.ke/api/v2/topup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authToken}`
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }
        
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}