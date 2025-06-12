import PayoutConfig, { IPayoutConfig } from "@/models/PayoutConfig";

// --- Helper functions from the cron job, now centralized ---

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

function getPayHeroFee(amount: number): number {
    if (amount <= 49) return 0;
    if (amount <= 499) return 6;
    if (amount <= 999) return 10;
    // ... (add all other fee tiers from your table)
    return 105; // Fallback
}

const normalizePhone = (phone: string) => phone.startsWith('0') ? `254${phone.substring(1)}` : phone;

/**
 * Processes a payout for a single employee configuration.
 * Fetches current wallet balance, calculates percentage, deducts fees, and initiates withdrawal.
 * @param config The IPayoutConfig document to process.
 * @returns A promise that resolves with the result of the withdrawal API call.
 */
export async function processSinglePayout(config: IPayoutConfig) {
    // 1. Fetch current payments wallet balance
    const walletUrl = `https://backend.payhero.co.ke/api/v2/payment_channels/${process.env.PAYHERO_WALLET_CHANNEL_ID}`;
    const walletData = await fetchPayHeroAPI(walletUrl);
    const availableBalance = walletData.balance_plain?.balance || 0;
    console.log(`Processing payout for ${config.name}. Wallet Balance: KES ${availableBalance}`);

    // 2. Calculate payout amount and fee
    const payoutAmount = (availableBalance * config.payoutPercentage) / 100;
    const fee = getPayHeroFee(payoutAmount);
    const totalDeduction = payoutAmount + fee;

    // 3. Check if balance is sufficient
    if (availableBalance < totalDeduction) {
        throw new Error(`Insufficient balance. Requires ${totalDeduction.toFixed(2)}, but only ${availableBalance.toFixed(2)} is available.`);
    }

    // 4. Execute withdrawal via PayHero API
    const withdrawalPayload = {
        external_reference: `manual_payout_${config._id}_${Date.now()}`,
        amount: Math.floor(payoutAmount), // Amount must be an integer
        phone_number: normalizePhone(config.phone),
        network_code: "63902", // M-Pesa
        channel: "mobile",
        channel_id: parseInt(process.env.PAYHERO_WALLET_CHANNEL_ID!),
        payment_service: "b2c",
    };
    
    const result = await fetchPayHeroAPI('https://backend.payhero.co.ke/api/v2/withdraw', {
        method: 'POST',
        body: JSON.stringify(withdrawalPayload)
    });

    console.log(`Payout of KES ${payoutAmount} initiated for ${config.name}.`);

    // 5. Update the config's last payout date
    config.lastPayoutDate = new Date();
    await config.save();

    return result;
}