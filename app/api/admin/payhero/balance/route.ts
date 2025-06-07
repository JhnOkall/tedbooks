import { NextResponse } from 'next/server';
import { auth } from '@/auth';

async function fetchPayHeroAPI(url: string) {
    const { PAYHERO_API_USERNAME, PAYHERO_API_PASSWORD } = process.env;
    if (!PAYHERO_API_USERNAME || !PAYHERO_API_PASSWORD) {
        throw new Error("PayHero credentials are not set in environment variables.");
    }
    const authToken = Buffer.from(`${PAYHERO_API_USERNAME}:${PAYHERO_API_PASSWORD}`).toString('base64');
    
    const response = await fetch(url, {
        headers: { 'Authorization': `Basic ${authToken}` },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`PayHero API error (${response.status}): ${errorBody}`);
    }
    return response.json();
}

export async function GET() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const serviceWalletUrl = 'https://backend.payhero.co.ke/api/v2/wallets?wallet_type=service_wallet';
        const paymentWalletUrl = `https://backend.payhero.co.ke/api/v2/payment_channels/${process.env.PAYHERO_WALLET_CHANNEL_ID}`;

        const [serviceWallet, paymentWallet] = await Promise.all([
            fetchPayHeroAPI(serviceWalletUrl),
            fetchPayHeroAPI(paymentWalletUrl)
        ]);
        
        const balances = {
            serviceBalance: serviceWallet.available_balance || 0,
            paymentsBalance: paymentWallet.balance_plain?.balance || 0,
        };
        
        return NextResponse.json(balances);

    } catch (error: any) {
        console.error("Error fetching PayHero balances:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}