import { IBook } from "@/models/Book";

// Helper function to get the base URL for API calls
// This works on both server and client, and is configurable via environment variables
function getBaseUrl() {
  // If running on the server, use the internal host
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Otherwise, use the localhost URL for local development
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

/**
 * Fetches books that are marked as featured.
 * Uses Next.js's built-in fetch for server-side caching.
 * @returns A promise that resolves to an array of IBook objects.
 */
export async function getFeaturedBooks(): Promise<IBook[]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/books?featured=true`;
  
  console.log('Fetching featured books from:', url);
  
  try {
    const res = await fetch(url, {
      // Revalidate this data every hour (3600 seconds)
      // This caches the result and prevents hitting the DB on every request.
      next: { revalidate: 3600 },
    });

    console.log('Response status:', res.status, res.statusText);

    if (!res.ok) {
      // Get the response body for more details
      const errorText = await res.text();
      console.error(`Failed to fetch featured books: ${res.status} ${res.statusText}`, errorText);
      
      // Try to parse as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Error details:', errorJson);
      } catch {
        // Not JSON, just log the text
        console.error('Error response:', errorText);
      }
      
      return [];
    }

    const data = await res.json();
    console.log(`Successfully fetched ${data.length} featured books`);
    return data;
  } catch (error) {
    console.error("An error occurred in getFeaturedBooks:", error);
    // Return an empty array on network or other errors to prevent page crash
    return [];
  }
}

/**
 * Fetches all books, with optional search query.
 * This is not cached by default as search results are dynamic.
 * @param searchQuery Optional string to search by title or author.
 * @returns A promise that resolves to an array of IBook objects.
 */
export async function getAllBooks(searchQuery?: string): Promise<IBook[]> {
  const baseUrl = getBaseUrl();
  let url = `${baseUrl}/api/books`;

  if (searchQuery) {
    url += `?search=${encodeURIComponent(searchQuery)}`;
  }
  
  try {
    const res = await fetch(url, {
      // Use 'no-store' because the result depends on the search query
      // and should always be fresh.
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch books: ${res.statusText}`, errorText);
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error("An error occurred in getAllBooks:", error);
    return [];
  }
}

/**
 * Fetches a single book by its ID from the API.
 * Caches the result to speed up subsequent requests.
 * @param id The MongoDB _id of the book.
 * @returns A promise that resolves to the IBook object or null if not found.
 */
export async function getBookById(id: string): Promise<IBook | null> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/books/${id}`, {
      // Cache this book's data for an hour
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      // Handles 404 Not Found from the API
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error(`Error fetching book with ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetches other books from the same category to show as "related".
 * @param book The main book object to find related books for.
 * @returns A promise that resolves to an array of related IBook objects.
 */
export async function getRelatedBooks(book: IBook): Promise<IBook[]> {
  if (!book.category) return [];

  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/books?category=${encodeURIComponent(book.category)}`, {
      next: { revalidate: 3600 },
    });
    
    if (!res.ok) return [];
    
    const booksInCategory: IBook[] = await res.json();

    // Filter out the current book from the list and take up to 4 others
    return booksInCategory
      .filter(relatedBook => relatedBook._id !== book._id)
      .slice(0, 4);
  } catch (error) {
    console.error(`Error fetching related books for category ${book.category}:`, error);
    return [];
  }
}