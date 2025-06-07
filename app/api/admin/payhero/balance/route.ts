/**
 * @file This file defines the API route handler for fetching PayHero wallet balances.
 * It is an admin-only endpoint that provides a summary of financial data from the
 * external PayHero payment service.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * A reusable helper function to make authenticated requests to the PayHero API.
 * It encapsulates the logic for adding Basic Authentication headers to the fetch call.
 *
 * @param {string} url - The full URL of the PayHero API endpoint to request.
 * @returns {Promise<any>} A promise that resolves to the JSON response from the API.
 * @throws {Error} Throws an error if API credentials are not set or if the API request fails.
 */
async function fetchPayHeroAPI(url: string) {
  const { PAYHERO_API_USERNAME, PAYHERO_API_PASSWORD } = process.env;

  // Ensure that the necessary API credentials are available in the environment variables.
  if (!PAYHERO_API_USERNAME || !PAYHERO_API_PASSWORD) {
    throw new Error('PayHero API credentials are not set in environment variables.');
  }

  // Create the Basic Authentication token by Base64-encoding the credentials.
  const authToken = Buffer.from(
    `${PAYHERO_API_USERNAME}:${PAYHERO_API_PASSWORD}`
  ).toString('base64');

  const response = await fetch(url, {
    headers: { Authorization: `Basic ${authToken}` },
  });

  // Handle non-successful API responses.
  if (!response.ok) {
    const errorBody = await response.text();
    // Throw a detailed error for better server-side debugging.
    throw new Error(`PayHero API error (${response.status}): ${errorBody}`);
  }

  // TODO: Define specific TypeScript interfaces for the expected API responses
  // from PayHero to improve type safety and avoid using `any`.
  return response.json();
}

/**
 * Handles GET requests to this API route.
 * It fetches balances from two different PayHero wallets and returns them in a structured format.
 * Access is restricted to users with the 'admin' role.
 *
 * @returns {Promise<NextResponse>} A promise that resolves to the API response.
 */
export async function GET() {
  const session = await auth();

  // Security check: Ensure the user is authenticated and has the 'admin' role.
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    // TODO: Move the base PayHero API URL to an environment variable (`PAYHERO_API_BASE_URL`)
    // to make the endpoints more maintainable and easier to change across environments.
    const serviceWalletUrl =
      'https://backend.payhero.co.ke/api/v2/wallets?wallet_type=service_wallet';
    const paymentWalletUrl = `https://backend.payhero.co.ke/api/v2/payment_channels/${process.env.PAYHERO_WALLET_CHANNEL_ID}`;

    // Fetch both wallet balances in parallel to improve performance.
    const [serviceWallet, paymentWallet] = await Promise.all([
      fetchPayHeroAPI(serviceWalletUrl),
      fetchPayHeroAPI(paymentWalletUrl),
    ]);

    // Structure the response, using fallbacks to 0 for safety.
    const balances = {
      // Safely access the available balance, defaulting to 0 if the property is missing.
      serviceBalance: serviceWallet.available_balance || 0,
      // Safely access the nested balance using optional chaining and a fallback.
      paymentsBalance: paymentWallet.balance_plain?.balance || 0,
    };

    return NextResponse.json(balances);
  } catch (error: any) {
    // TODO: [Production] Integrate a dedicated logging service (e.g., Sentry, Axiom)
    // instead of `console.error` for better error tracking and alerting in production.
    console.error('Error fetching PayHero balances:', error);

    // TODO: [Security] In a production environment, avoid returning the raw `error.message`
    // to the client as it may expose internal implementation details. Return a generic
    // error message instead (e.g., "An internal server error occurred.").
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}