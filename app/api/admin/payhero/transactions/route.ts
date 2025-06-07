/**
 * @file This file defines the API route handler for fetching a list of transactions.
 * It is a protected, admin-only endpoint that acts as a proxy to the PayHero
 * transactions API, forwarding any provided query parameters.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Handles GET requests to fetch transaction data from the PayHero service.
 * It authenticates the user as an admin and then forwards the request, including
 * any query parameters for filtering or pagination, to the external API.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response.
 */
export async function GET(request: NextRequest) {
  // Step 1: Authenticate the session and verify admin privileges.
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  // Step 2: Ensure PayHero API credentials are configured in environment variables.
  const { PAYHERO_API_USERNAME, PAYHERO_API_PASSWORD } = process.env;
  if (!PAYHERO_API_USERNAME || !PAYHERO_API_PASSWORD) {
    console.error('PayHero API credentials are not set in environment variables.');
    return NextResponse.json(
      { message: 'Server configuration error.' },
      { status: 500 }
    );
  }

  // Step 3: Construct the Basic Authentication header for the PayHero API.
  const authToken = Buffer.from(
    `${PAYHERO_API_USERNAME}:${PAYHERO_API_PASSWORD}`
  ).toString('base64');

  // Step 4: Extract search parameters from the incoming request URL.
  const { searchParams } = new URL(request.url);
  // TODO: Implement validation or sanitization for `searchParams` to ensure only
  // expected parameters are forwarded to the external API. This can prevent
  // unexpected behavior or potential security issues.

  try {
    // Step 5: Make the authenticated request to the PayHero transactions endpoint.
    // The original search parameters are passed directly to the external API.
    // TODO: Move the PayHero API base URL to an environment variable for better maintainability.
    const response = await fetch(
      `https://backend.payhero.co.ke/api/v2/transactions?${searchParams.toString()}`,
      {
        headers: { Authorization: `Basic ${authToken}` },
      }
    );

    // Step 6: Handle non-successful responses from the external API.
    if (!response.ok) {
      throw new Error('Failed to fetch transactions from the provider.');
    }

    const data = await response.json();
    // TODO: Define a TypeScript interface for the PayHero transaction data structure
    // to improve type safety and avoid implicit `any`.

    return NextResponse.json(data);
  } catch (error: any) {
    // TODO: [Production] Integrate a dedicated logging service (e.g., Sentry, Axiom)
    // for better error tracking and alerting in production.
    console.error('Error fetching PayHero transactions:', error);

    // TODO: [Security] In a production environment, avoid returning the raw `error.message`
    // to the client as it can expose internal implementation details. Return a generic
    // error message instead (e.g., "An internal server error occurred.").
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}