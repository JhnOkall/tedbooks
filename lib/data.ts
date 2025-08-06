/**
 * @file This module contains data-fetching functions for interacting with the
 * application's API endpoints. It utilizes Next.js's extended `fetch` API for
 * caching and revalidation strategies.
 */

// --- MODIFICATION START ---
// Import the frontend-facing types for better type safety in data-fetching functions.
import { Book, Genre } from '@/types';
// --- MODIFICATION END ---

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

// --- MODIFICATION START ---
/**
 * A Note on API Endpoints:
 * For the following functions to work, your API endpoints (e.g., in `app/api/books/route.ts`)
 * must be updated to use Mongoose's `.populate('genre')` method when querying for books.
 * This will replace the genre's ObjectId with the full genre document.
 *
 * Example:
 * const books = await Book.find({ featured: true }).populate('genre');
 */
// --- MODIFICATION END ---

/**
 * Fetches an array of books that are marked as "featured".
 * This function is optimized by caching the response for one hour.
 *
 * @returns {Promise<Book[]>} A promise that resolves to an array of featured books.
 */
export async function getFeaturedBooks(): Promise<Book[]> {
  const baseUrl = getBaseUrl();
  try {
    // The API endpoint must populate the 'genre' field for this to work correctly.
    const res = await fetch(`${baseUrl}/api/books?featured=true`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(`Failed to fetch featured books: ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('An error occurred in getFeaturedBooks:', error);
    return [];
  }
}

/**
 * Fetches all books, with optional filtering by search query or genre slug.
 * This fetch is not cached (`cache: 'no-store'`) to ensure that results
 * are always up-to-date.
 *
 * @param {{ searchQuery?: string; genreSlug?: string }} params - Optional search and genre filters.
 * @returns {Promise<Book[]>} A promise that resolves to an array of books matching the criteria.
 */
// --- MODIFICATION START ---
export async function getAllBooks(params: {
  searchQuery?: string;
  genreSlug?: string;
}): Promise<Book[]> {
  const { searchQuery, genreSlug } = params;
  const baseUrl = getBaseUrl();
  const queryParams = new URLSearchParams();

  if (searchQuery) {
    queryParams.append('search', searchQuery);
  }
  // The API endpoint should be designed to find the genre by slug and then query books.
  if (genreSlug) {
    queryParams.append('genre', genreSlug);
  }

  const url = `${baseUrl}/api/books?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
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
// --- MODIFICATION END ---

/**
 * Fetches a single book by its unique identifier.
 * The result is cached for one hour to improve performance for frequently accessed books.
 *
 * @param {string} id - The unique MongoDB `_id` of the book to retrieve.
 * @returns {Promise<Book | null>} A promise that resolves to the book object, or `null`.
 */
export async function getBookById(id: string): Promise<Book | null> {
  const baseUrl = getBaseUrl();
  try {
    // The API endpoint must populate the 'genre' field.
    const res = await fetch(`${baseUrl}/api/books/${id}`, {
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
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
 * Fetches a list of related books from the same genre, excluding the source book.
 * This function is now optimized to let the API handle filtering and limiting.
 *
 * @param {Book} book - The primary book object.
 * @returns {Promise<Book[]>} A promise that resolves to an array of up to 4 related books.
 */
// --- MODIFICATION START ---
export async function getRelatedBooks(book: Book): Promise<Book[]> {
  // The 'book' object now has a 'genre' object with an '_id'
  if (!book.genre?._id) return [];

  const baseUrl = getBaseUrl();
  try {
    // API is enhanced to handle filtering by genre ID, excluding a specific book, and limiting results.
    const url = `${baseUrl}/api/books?genreId=${book.genre._id}&exclude=${book._id}&limit=4`;

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache related books for an hour
    });

    if (!res.ok) {
      console.error(
        `Failed to fetch related books for genre ${book.genre.name}: ${res.statusText}`
      );
      return [];
    }
    // The client-side filtering and slicing is no longer needed.
    return res.json();
  } catch (error) {
    console.error(
      `Error fetching related books for genre ${book.genre.name}:`,
      error
    );
    return [];
  }
}
// --- MODIFICATION END ---

// --- NEW FUNCTIONS FOR GENRES ---

/**
 * Fetches all available genres from the API.
 * Results are cached for 24 hours as genres change infrequently.
 *
 * @returns {Promise<Genre[]>} A promise that resolves to an array of all genres.
 */
export async function getAllGenres(): Promise<Genre[]> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/genres`, {
      // Revalidate once a day (86400 seconds)
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      console.error(`Failed to fetch genres: ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('An error occurred in getAllGenres:', error);
    return [];
  }
}

/**
 * Fetches a single genre by its URL-friendly slug.
 * The result is cached for one hour.
 *
 * @param {string} slug - The slug of the genre to retrieve.
 * @returns {Promise<Genre | null>} A promise that resolves to the genre object, or `null`.
 */
export async function getGenreBySlug(slug: string): Promise<Genre | null> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/genres/${slug}`, {
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      console.error(`Failed to fetch genre ${slug}: ${res.statusText}`);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error(`Error fetching genre with slug ${slug}:`, error);
    return null;
  }
}