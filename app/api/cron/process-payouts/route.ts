import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PayoutConfig from '@/models/PayoutConfig';

// --- Helper Functions ---

// Fetches PayHero API with authentication
async function fetchPayHeroAPI(url: string, options: RequestInit = {}) {
    const { PAYHERO_API_USERNAME, PAYHERO_API_PASSWORD } = process.env;
    const authToken = Buffer.from(`${PAYHERO_API_USERNAME}:${PAYHERO_API_PASSWORD}`).toString('base64');
    options.headers = { ...options.headers, 'Authorization': `Basic ${authToken}`, 'Content-Type': 'application/json' };
    
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`PayHero API error (${response.status}): ${errorBody}`);
    }
    return response.json();
}

// Calculates withdrawal fee based on PayHero's table
function getPayHeroFee(amount: number): number {
    if (amount >= 1 && amount <= 49) return 0;
    if (amount >= 50 && amount <= 499) return 6;
    if (amount >= 500 && amount <= 999) return 10;
    if (amount >= 1000 && amount <= 1499) return 15;
    if (amount >= 1500 && amount <= 2499) return 20;
    if (amount >= 2500 && amount <= 3499) return 25;
    if (amount >= 3500 && amount <= 4999) return 30;
    if (amount >= 5000 && amount <= 7499) return 40;
    if (amount >= 7500 && amount <= 9999) return 45;
    if (amount >= 10000 && amount <= 14999) return 50;
    if (amount >= 15000 && amount <= 19999) return 55;
    if (amount >= 20000 && amount <= 34999) return 80;
    return 105; // Fallback for amounts > 35,000 as per common rates
}

// Normalizes phone number to 254 format
const normalizePhone = (phone: string) => phone.startsWith('0') ? `254${phone.substring(1)}` : phone;

// Main cron job handler
export async function GET(request: NextRequest) {
    // 1. Secure the endpoint
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    try {
        // 2. Fetch current payments wallet balance
        const walletUrl = `https://backend.payhero.co.ke/api/v2/payment_channels/${process.env.PAYHERO_WALLET_CHANNEL_ID}`;
        const walletData = await fetchPayHeroAPI(walletUrl);
        let availableBalance = walletData.balance_plain?.balance || 0;
        console.log(`Cron Job Started. Available Payments Balance: KES ${availableBalance}`);

        // 3. Fetch all active payout configurations
        const configs = await PayoutConfig.find({ isActive: true });
        const today = new Date();

        for (const config of configs) {
            let isPayoutDay = false;
            // 4. Check if today is a payout day
            if (config.payoutFrequency === 'weekly' && today.getDay() === 0) { // Sunday
                isPayoutDay = true;
            }
            if (config.payoutFrequency === 'monthly' && today.getDate() === 1) { // 1st of the month
                isPayoutDay = true;
            }

            if (!isPayoutDay) continue;

            // 5. Calculate payout amount and fee
            const payoutAmount = (availableBalance * config.payoutPercentage) / 100;
            const fee = getPayHeroFee(payoutAmount);
            const totalDeduction = payoutAmount + fee;

            console.log(`Processing payout for ${config.name}. Payout: ${payoutAmount}, Fee: ${fee}, Total: ${totalDeduction}`);

            // 6. Check if balance is sufficient
            if (availableBalance < totalDeduction) {
                console.log(`Insufficient balance for ${config.name}. Skipping.`);
                continue;
            }

            // 7. Execute withdrawal
            const withdrawalPayload = {
                external_reference: `payout_${config._id}_${Date.now()}`,
                amount: Math.floor(payoutAmount), // Amount must be an integer
                phone_number: normalizePhone(config.phone),
                network_code: "63902", // M-Pesa
                channel: "mobile",
                channel_id: parseInt(process.env.PAYHERO_WALLET_CHANNEL_ID!),
                payment_service: "b2c",
            };
            
            await fetchPayHeroAPI('https://backend.payhero.co.ke/api/v2/withdraw', {
                method: 'POST',
                body: JSON.stringify(withdrawalPayload)
            });

            console.log(`Payout of KES ${payoutAmount} initiated for ${config.name} to ${config.phone}.`);

            // 8. Update state
            availableBalance -= totalDeduction;
            config.lastPayoutDate = new Date();
            await config.save();
        }

        console.log("Cron Job Finished Successfully.");
        return NextResponse.json({ status: 'success', processed: configs.length });

    } catch (error: any) {
        console.error("Cron job failed:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}