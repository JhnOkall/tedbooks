/**
 * @file This module contains data-fetching functions for interacting with the
 * application's API endpoints. It utilizes Next.js's extended `fetch` API for
 * caching and revalidation strategies, now with pagination support.
 */

import { Book, Genre } from '@/types';

/**
 * Retrieves the base URL for API calls.
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

/**
 * Fetches an array of books that are marked as "featured".
 * This function is optimized by caching the response for one hour.
 *
 * @returns {Promise<Book[]>} A promise that resolves to an array of featured books.
 */
export async function getFeaturedBooks(): Promise<Book[]> {
  const baseUrl = getBaseUrl();
  try {
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
 * Fetches the first page of books for infinite scroll, with optional filtering by search query or genre slug.
 * This fetch is not cached to ensure results are always up-to-date.
 *
 * @param {{ searchQuery?: string; genreSlug?: string }} params - Optional search and genre filters.
 * @returns {Promise<Book[]>} A promise that resolves to an array of books matching the criteria.
 */
export async function getAllBooks(params: {
  searchQuery?: string;
  genreSlug?: string;
}): Promise<Book[]> {
  const { searchQuery, genreSlug } = params;
  const baseUrl = getBaseUrl();
  const queryParams = new URLSearchParams({
    page: '1',
    limit: '12'
  });

  if (searchQuery) {
    queryParams.append('search', searchQuery);
  }
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

    const data = await res.json();
    
    // Check if the response includes pagination info (when page parameter is used)
    if (data.books) {
      return data.books;
    }
    
    // Fallback for responses without pagination wrapper
    return data;
  } catch (error) {
    console.error('An error occurred in getAllBooks:', error);
    return [];
  }
}

/**
 * Fetches books with full pagination information.
 * Useful for admin panels or when you need pagination metadata.
 *
 * @param {object} params - Parameters for fetching paginated books.
 * @param {number} params.page - The page number to fetch.
 * @param {number} params.limit - Number of books per page.
 * @param {string} [params.searchQuery] - Optional search query.
 * @param {string} [params.genreSlug] - Optional genre slug filter.
 * @returns {Promise<{books: Book[], pagination: any}>} Paginated book results with metadata.
 */
export async function getBooksWithPagination(params: {
  page: number;
  limit: number;
  searchQuery?: string;
  genreSlug?: string;
}): Promise<{ books: Book[]; pagination: any }> {
  const { page, limit, searchQuery, genreSlug } = params;
  const baseUrl = getBaseUrl();
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (searchQuery) {
    queryParams.append('search', searchQuery);
  }
  if (genreSlug) {
    queryParams.append('genre', genreSlug);
  }

  const url = `${baseUrl}/api/books?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Failed to fetch paginated books: ${res.statusText}`);
      return { books: [], pagination: null };
    }

    return res.json();
  } catch (error) {
    console.error('An error occurred in getBooksWithPagination:', error);
    return { books: [], pagination: null };
  }
}

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
 * This function is optimized to let the API handle filtering and limiting.
 *
 * @param {string} genreId - The genre ID to find related books for.
 * @param {string} [excludeBookId] - Optional book ID to exclude from results.
 * @returns {Promise<Book[]>} A promise that resolves to an array of up to 4 related books.
 */
export async function getRelatedBooks(genreId: string, excludeBookId?: string): Promise<Book[]> {
  if (!genreId) return [];

  const baseUrl = getBaseUrl();
  try {
    const url = `${baseUrl}/api/books?genreId=${genreId}&exclude=${excludeBookId || ''}&limit=4`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error(
        `Failed to fetch related books for genre ${genreId}: ${res.statusText}`
      );
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error(
      `Error fetching related books for genre ${genreId}:`,
      error
    );
    return [];
  }
}

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