/**
 * @file This module contains data-fetching functions for interacting with the
 * book-related API endpoints. It utilizes Next.js's extended `fetch` API for
 * caching and revalidation strategies.
 */

import { IBook } from '@/models/Book';

/**
 * Retrieves the base URL for API calls.
 * This utility function ensures that API requests are directed to the correct
 * host, whether in a local development environment or a deployed production environment.
 * It prioritizes the `NEXT_PUBLIC_BASE_URL` environment variable and falls back to localhost.
 * @returns {string} The base URL for the application.
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

/**
 * Fetches an array of books that are marked as "featured".
 * This function is optimized for performance by caching the response for one hour
 * using Next.js's Incremental Static Regeneration (ISR).
 *
 * @returns {Promise<IBook[]>} A promise that resolves to an array of featured books.
 * Returns an empty array if the fetch fails or an error occurs.
 */
export async function getFeaturedBooks(): Promise<IBook[]> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/books?featured=true`, {
      // Revalidate this data at most once every hour (3600 seconds).
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      // TODO: Implement a more robust logging service instead of console.error for production environments.
      console.error(`Failed to fetch featured books: ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('An error occurred in getFeaturedBooks:', error);
    // Gracefully handle network or other exceptions by returning an empty array.
    return [];
  }
}

/**
 * Fetches all books, optionally filtered by a search query.
 * This fetch is not cached (`cache: 'no-store'`) to ensure that search results
 * are always up-to-date and reflect the most current data.
 *
 * @param {string} [searchQuery] - An optional string to search against book titles or authors.
 * @returns {Promise<IBook[]>} A promise that resolves to an array of books matching the criteria.
 * Returns an empty array on failure.
 */
export async function getAllBooks(searchQuery?: string): Promise<IBook[]> {
  const baseUrl = getBaseUrl();
  let url = `${baseUrl}/api/books`;

  if (searchQuery) {
    url += `?search=${encodeURIComponent(searchQuery)}`;
  }

  try {
    const res = await fetch(url, {
      // Opt out of caching to ensure dynamic search results are always fresh.
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Failed to fetch books: ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('An error occurred in getAllBooks:', error);
    return [];
  }
}

/**
 * Fetches a single book by its unique identifier.
 * The result is cached for one hour to improve performance for frequently accessed books.
 *
 * @param {string} id - The unique MongoDB `_id` of the book to retrieve.
 * @returns {Promise<IBook | null>} A promise that resolves to the book object,
 * or `null` if the book is not found or an error occurs.
 */
export async function getBookById(id: string): Promise<IBook | null> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/books/${id}`, {
      // Cache this specific book's data for one hour.
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return null; // Handle "Not Found" gracefully.
    }

    if (!res.ok) {
      // For other errors, log the issue and return null.
      console.error(`Failed to fetch book ${id}: ${res.statusText}`);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error(`Error fetching book with ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetches a list of books from the same category as a given book, to be used as
 * "related" or "recommended" products.
 *
 * @param {IBook} book - The primary book object used to determine the category.
 * @returns {Promise<IBook[]>} A promise that resolves to an array of up to 4 related books,
 * excluding the original book. Returns an empty array on failure.
 */
export async function getRelatedBooks(book: IBook): Promise<IBook[]> {
  if (!book.category) return [];

  const baseUrl = getBaseUrl();
  try {
    // TODO: Optimize this by enhancing the API. The API endpoint should support
    // excluding an ID and limiting the results directly (e.g., `/api/books?category=...&excludeId=...&limit=4`)
    // to avoid over-fetching and filtering on the client-side.
    const res = await fetch(
      `${baseUrl}/api/books?category=${encodeURIComponent(book.category)}`,
      {
        next: { revalidate: 3600 }, // Cache category results for an hour.
      }
    );

    if (!res.ok) {
      console.error(
        `Failed to fetch related books for category ${book.category}: ${res.statusText}`
      );
      return [];
    }

    const booksInCategory: IBook[] = await res.json();

    // Filter out the current book from the results and limit to the first 4.
    return booksInCategory
      .filter((relatedBook) => relatedBook._id !== book._id)
      .slice(0, 4);
  } catch (error) {
    console.error(
      `Error fetching related books for category ${book.category}:`,
      error
    );
    return [];
  }
}