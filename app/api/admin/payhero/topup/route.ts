/**
 * @file This file defines the API route handler for initiating a service wallet top-up.
 * This is a protected, admin-only endpoint that forwards top-up requests to the
 * external PayHero payment service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Handles POST requests to this API route to initiate a wallet top-up.
 * It validates the admin session, constructs an authenticated request, and forwards
 * the top-up payload to the PayHero API.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response.
 */
export async function POST(request: NextRequest) {
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

  // Step 4: Parse the incoming request body.
  const body = await request.json();
  // TODO: Implement robust validation for the `body` using a library like Zod to ensure
  // it contains all required fields (e.g., `amount`, `phone_number`) in the correct
  // format before sending it to the external API.

  try {
    // Step 5: Forward the request to the PayHero top-up endpoint.
    // TODO: Move the PayHero API base URL to an environment variable to improve maintainability
    // and ease configuration across different environments (e.g., staging, production).
    const response = await fetch('https://backend.payhero.co.ke/api/v2/topup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    // Step 6: Process the response from the PayHero API.
    const data = await response.json();
    if (!response.ok) {
      // If the external API returns an error, forward the error response.
      return NextResponse.json(data, { status: response.status });
    }

    // On success, return the response from PayHero.
    return NextResponse.json(data);
  } catch (error: any) {
    // TODO: [Production] Integrate a dedicated logging service (e.g., Sentry)
    // for better error tracking and alerting in production.
    console.error('Error during PayHero top-up request:', error);

    // TODO: [Security] In a production environment, avoid returning the raw `error.message`
    // to the client as it can expose internal implementation details. Return a generic
    // error message instead (e.g., "An internal server error occurred.").
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}