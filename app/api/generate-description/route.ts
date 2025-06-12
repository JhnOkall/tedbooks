/**
 * @file This file defines the API route handler for generating book descriptions and synopses
 * using the Google Gemini AI. This endpoint is designed to be called from an administrative
 * interface to assist with content creation for new book entries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Initializes the Google Generative AI client.
 * It is crucial that the `GEMINI_API_KEY` environment variable is set.
 */
// TODO: [Security] Add a more robust check for the API key at application startup
// to fail fast if it's missing, rather than on the first API call.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Handles POST requests to generate AI-powered book content.
 * It takes a book's title and author, and returns a structured JSON object
 * containing a short description and a detailed synopsis.
 *
 * @param {NextRequest} req - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the API response with the generated content or an error.
 */
export async function POST(req: NextRequest) {
  // TODO: [Security] This is a public-facing API endpoint that could incur costs.
  // Implement authentication (e.g., admin-only access) and rate limiting to prevent abuse.
  try {
    // Step 1: Extract and validate the title and author from the request body.
    const { title, author } = await req.json();
    if (!title || !author) {
      return NextResponse.json(
        { error: 'Title and Author are required.' },
        { status: 400 }
      );
    }
    // TODO: Use a validation library like Zod to enforce stricter type checks and sanitization on the input.

    // Step 2: Configure the Gemini model for structured JSON output.
    // Using `gemini-1.5-flash` provides a good balance of speed and capability for this task.
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        // This is a critical setting that instructs the model to only output a valid JSON string,
        // which simplifies parsing and improves reliability.
        responseMimeType: 'application/json',
      },
    });

    // Step 3: Construct a detailed prompt to guide the AI's response.
    // This prompt clearly defines the persona (literary expert), the required input,
    // and the exact structure and content requirements for the JSON output.
    const prompt = `
      You are a literary expert and skilled marketer. Generate a book description and a synopsis for the following book.

      Book Title: "${title}"
      Author: "${author}"

      Provide the response as a valid JSON object with two keys: "description" and "synopsis".

      - "description": A short, catchy summary for card views. It should be 1-2 sentences long to entice potential readers.
      - "synopsis": A more detailed and compelling summary of the book's plot, main characters, and central themes. This should be 2-3 paragraphs long.

      Do not include any text, backticks, or markdown formatting outside of the JSON object itself.
    `;

    // Step 4: Call the Gemini API with the constructed prompt.
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedContent = response.text();

    if (!generatedContent) {
      throw new Error('AI failed to generate content.');
    }

    // Step 5: Parse the guaranteed JSON string from the AI and return it to the client.
    const parsedContent = JSON.parse(generatedContent);

    return NextResponse.json(parsedContent);
  } catch (error) {
    // TODO: [Observability] Integrate a robust logging service (e.g., Sentry, Axiom)
    // to capture and monitor errors from this external API integration.
    console.error('Error generating book description with Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to generate description. Please try again.' },
      { status: 500 }
    );
  }
}